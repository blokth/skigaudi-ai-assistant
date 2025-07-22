import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type DocumentSnapshot } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pdfParse from "pdf-parse";
import { chunk } from "llm-chunk";
import { ai, EMBEDDER } from "./genkit/core";


const app = initializeApp({ credential: applicationDefault() });
const firestore = getFirestore(app);
const storage = getStorage(app);

const indexConfig = {
  collection: "knowledge",
  contentField: "content",
  vectorField: "embedding",
  embedder: EMBEDDER,
};

export async function indexKnowledgeDocument(snap: DocumentSnapshot) {
  const data = snap.data();
  if (!data) return;

  const embedding = (
    await ai.embed({
      embedder: indexConfig.embedder,
      content: data[indexConfig.contentField],
    })
  )[0].embedding;

  await snap.ref.update({
    [indexConfig.vectorField]: FieldValue.vector(embedding),
  });
}

export const knowledgeDocIndexer = onObjectFinalized(
  { region: "us-central1" },
  async (event) => {
    const object = event.data;
    if (!object) return;

    const filePath = object.name || "";
    const contentType = object.contentType || "";

    if (
      !/\.(pdf|txt|md)$/i.test(filePath) &&
      !["application/pdf", "text/plain", "text/markdown"].includes(contentType)
    ) {
      return;
    }

    const bucket = storage.bucket(object.bucket);
    const tempPath = join(tmpdir(), filePath.split("/").pop()!);
    await bucket.file(filePath).download({ destination: tempPath });

    let text = "";
    try {
      if (
        contentType.startsWith("application/pdf") ||
        /\.pdf$/i.test(filePath)
      ) {
        const dataBuffer = fs.readFileSync(tempPath);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else {
        text = fs.readFileSync(tempPath, "utf8");
      }
    } finally {
      fs.unlink(tempPath, () => { });
    }

    if (!text.trim()) return;

    // Split the document into smaller overlapping chunks for higher-quality retrieval.
    const chunks: string[] = chunk(text, {
      minLength: 1000,
      maxLength: 2000,
      overlap: 100,
      splitter: "sentence",
      delimiters: "",
    });

    const embedResults = (
      await ai.embed({
        embedder: indexConfig.embedder,
        content: chunks,
      })
    ).map((r) => r.embedding);

    const batch = firestore.batch();
    chunks.forEach((chunk, idx) => {
      const docRef = firestore
        .collection(indexConfig.collection)
        .doc(filePath.replace(/\//g, "__") + `__${idx}`);

      batch.set(
        docRef,
        {
          title: filePath.split("/").pop(),
          [indexConfig.contentField]: chunk,
          [indexConfig.vectorField]: FieldValue.vector(embedResults[idx]),
        },
        { merge: true },
      );
    });
    await batch.commit();
  },
);

export const knowledgeEmbeddingIndexer = onDocumentWritten(
  { document: "knowledge/{docId}", region: "us-central1" },
  async (event) => {
    const after = event.data?.after;

    if (after) await indexKnowledgeDocument(after);
  },
);
