import { onCallGenkit } from "firebase-functions/https";
import { faqChatFlow, ai } from "./genkit/flows";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbedding005 } from "@genkit-ai/vertexai"
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";

const USE_LOCAL_VECTORSTORE =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

const faqDevIndexer = devLocalIndexerRef("faqs");

export const faqChat = onCallGenkit({}, faqChatFlow);

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
