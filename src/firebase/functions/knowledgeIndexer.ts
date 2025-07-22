import { onObjectFinalized, onObjectDeleted } from "firebase-functions/v2/storage";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pdfParse from "pdf-parse";
import { chunk } from "llm-chunk";
import { ai, EMBEDDER } from "./genkit/core";


const firestore = admin.firestore();
const storage = admin.storage();

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
    const chunks = chunk(text, {
      minLength: 1000,
      maxLength: 2000,
      overlap: 100,
      splitter: "sentence",
      delimiters: "",
    });

    // Create an embedding for every chunk – one embed call per segment.
    const embedResults = await Promise.all(
      chunks.map(async (segment) => {
        const [res] = await ai.embed({
          embedder: indexConfig.embedder,
          content: segment,
        });
        return res.embedding;
      }),
    );

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

// ────────────────────────────────────────────────────────────
// When a file under `knowledge/…` is deleted from Cloud Storage
// remove all Firestore chunk-docs that originated from it.
// ────────────────────────────────────────────────────────────
export const knowledgeDocRemover = onObjectDeleted(
  { region: "us-central1" },
  async (event) => {
    const object = event.data;
    if (!object) return;

    const filePath = object.name ?? "";
    if (!filePath.startsWith("knowledge/")) return;      // we only care about that folder

    const originalFileName = filePath.split("/").pop()!; // e.g. "CV.pdf"

    // Every chunk-document stores the original filename in `title`
    const snap = await firestore
      .collection(indexConfig.collection)
      .where("title", "==", originalFileName)
      .get();

    if (snap.empty) return;

    const batch = firestore.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  },
);
