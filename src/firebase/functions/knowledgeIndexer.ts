import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbedding005 } from "@genkit-ai/vertexai";
import { ai } from "./genkit/core";
import * as admin from "firebase-admin";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pdfParse from "pdf-parse";
import { chunk } from "llm-chunk";

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function indexKnowledgeDocument(
  snap: admin.firestore.DocumentSnapshot,
) {
  const data = snap.data();
  if (!data) return;

  const embedding = (
    await ai.embed({ embedder: textEmbedding005, content: data.content })
  )[0].embedding;

  await snap.ref.update({ embedding: FieldValue.vector(embedding) });
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

    const bucket = admin.storage().bucket(object.bucket);
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

    let embedResults: number[][] = [];

    const batch = admin.firestore().batch();
    chunks.forEach((chunk, idx) => {
      const docRef = admin
        .firestore()
        .collection("knowledge")
        .doc(filePath.replace(/\//g, "__") + `__${idx}`);
      batch.set(
        docRef,
        {
          title: filePath.split("/").pop(),
          content: chunk,
          embedding: FieldValue.vector(embedResults[idx]),
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
