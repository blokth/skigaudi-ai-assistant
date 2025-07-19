import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbedding005 } from "@genkit-ai/vertexai";
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";
import { ai } from "./genkit/flows";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const USE_LOCAL_VECTORSTORE =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

const faqDevIndexer = devLocalIndexerRef("faqs");

/**
 * Embed and index a single FAQ document snapshot.
 * Re-used by the Firestore trigger and the admin CRUD tools so we
 * don’t invoke the Firebase onDocumentWritten handler manually.
 */
export async function indexFaqDocument(
  snapshot: admin.firestore.DocumentSnapshot
) {
  const data = snapshot.data();
  if (!data) return;

  const embedding = (
    await ai.embed({
      embedder: textEmbedding005,
      content: `${data.question}\n${data.answer}`,
    })
  )[0].embedding;

  if (USE_LOCAL_VECTORSTORE) {
    const document = Document.fromText(
      `${data.question}\n${data.answer}`,
      { id: snapshot.id, question: data.question }
    );
    await ai.index({
      indexer: faqDevIndexer,
      documents: [document],
    });
  } else {
    await snapshot.ref.update({
      embedding: FieldValue.vector(embedding),
    });
  }
}

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
