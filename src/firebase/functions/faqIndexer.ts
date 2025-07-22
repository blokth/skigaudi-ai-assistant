import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import { ai, EMBEDDER } from "./genkit/core";
import { onDocumentWritten } from "firebase-functions/v2/firestore";


const indexConfig = {
  collection: "faqs",
  vectorField: "embedding",
  embedder: EMBEDDER,
};

/**
 * Embed and index a single FAQ document snapshot.
 * Re-used by the Firestore trigger and the admin CRUD tools so we
 * don’t invoke the Firebase onDocumentWritten handler manually.
 */
export async function indexFaqDocument(snapshot: DocumentSnapshot) {
  const data = snapshot.data();
  if (!data) return;

  const embedding = (
    await ai.embed({
      embedder: indexConfig.embedder,
      content: `${data.question}\n${data.answer}`,
    })
  )[0].embedding;

  await snapshot.ref.update({
    [indexConfig.vectorField]: FieldValue.vector(embedding),
  });
}

export const faqEmbeddingIndexer = onDocumentWritten(
  { document: "faqs/{docId}", region: "us-central1" },
  async (event) => {
    const after = event.data?.after;
    if (after) await indexFaqDocument(after);
  },
);
