import { onObjectFinalized } from "firebase-functions/v2/storage";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbedding005 } from "@genkit-ai/vertexai";
import { ai } from "./genkit/flows";
import * as admin from "firebase-admin";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pdfParse from "pdf-parse";
import { chunk as chunkText } from "llm-chunk";
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";

if (!admin.apps.length) {
  admin.initializeApp();
}

const USE_LOCAL_VECTORSTORE =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

const knowledgeDevIndexer = devLocalIndexerRef("knowledge");


export const knowledgeDocIndexer = onObjectFinalized(
  { region: "us-central1" },
  async event => {
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
      if (contentType.startsWith("application/pdf") || /\.pdf$/i.test(filePath)) {
        const dataBuffer = fs.readFileSync(tempPath);
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text;
      } else {
        text = fs.readFileSync(tempPath, "utf8");
      }
    } finally {
      fs.unlink(tempPath, () => {});
    }

    if (!text.trim()) return;

    // Split the document into smaller overlapping chunks for higher-quality retrieval.
    const chunks: string[] = chunkText(text, {
      minLength: 200,
      maxLength: 1500,
      overlap: 200,
      splitter: "sentence",
    });

    // Embed each chunk – `ai.embed` expects a single string, so loop
    const embedResults = await Promise.all(
      chunks.map(async c => (await ai.embed({ embedder: textEmbedding005, content: c }))[0].embedding)
    );

    if (USE_LOCAL_VECTORSTORE) {
      const documents = chunks.map((chunk, idx) =>
        Document.fromText(chunk, {
          id: filePath.replace(/\//g, "__") + `__${idx}`,
          title: filePath.split("/").pop(),
        })
      );
      await ai.index({
        indexer: knowledgeDevIndexer,
        documents,
      });
    } else {
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
          { merge: true }
        );
      });
      await batch.commit();
    }
  }
);
