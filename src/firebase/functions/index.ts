import { onCallGenkit } from "firebase-functions/https";
import { faqChatFlow, ai } from "./genkit/flows";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbedding005 } from "@genkit-ai/vertexai"
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";
import * as admin from "firebase-admin";
import * as fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pdfParse from "pdf-parse";

const USE_LOCAL_VECTORSTORE =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

const faqDevIndexer = devLocalIndexerRef("faqs");

export const faqChat = onCallGenkit({ region: "us-central1" }, faqChatFlow);

// Keep FAQ docs vectorised
export const faqEmbeddingIndexer = onDocumentWritten(
  { document: "faqs/{docId}", region: "us-central1" },
  async event => {
    const afterSnap = event.data?.after;
    if (!afterSnap) return;
    const data = afterSnap.data();
    if (!data) return;

    const embedding =
      (await ai.embed({
        embedder: textEmbedding005,
        content: `${data.question}\n${data.answer}`,
      }))[0].embedding;

    if (USE_LOCAL_VECTORSTORE) {
      const document = Document.fromText(
        `${data.question}\n${data.answer}`,
        { id: afterSnap.id, question: data.question }
      );
      await ai.index({
        indexer: faqDevIndexer,
        documents: [document],
      });
    } else {
      await afterSnap.ref.update({
        embedding: FieldValue.vector(embedding),
      });
    }
  }
);

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

    const embedding =
      (await ai.embed({
        embedder: textEmbedding005,
        content: text,
      }))[0].embedding;

    if (USE_LOCAL_VECTORSTORE) {
      const document = Document.fromText(text, {
        id: filePath,
        title: filePath.split("/").pop(),
      });
      await ai.index({
        indexer: knowledgeDevIndexer,
        documents: [document],
      });
    } else {
      await admin
        .firestore()
        .collection("knowledge")
        .doc(filePath.replace(/\//g, "__"))
        .set(
          {
            title: filePath.split("/").pop(),
            content: text,
            embedding: FieldValue.vector(embedding),
          },
          { merge: true }
        );
    }
  }
);
