import { onCallGenkit } from "firebase-functions/https";
import { menuSuggestionFlow, faqChatFlow, ai } from "./genkit/flows";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { textEmbeddingGecko003 } from "@genkit-ai/vertexai";

export const menuSuggestion = onCallGenkit({}, menuSuggestionFlow);
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
        embedder: textEmbeddingGecko003,
        content: `${data.question}\n${data.answer}`,
      }))[0].embedding;

    await afterSnap.ref.update({
      embedding: FieldValue.vector(embedding),
    });
  }
);
