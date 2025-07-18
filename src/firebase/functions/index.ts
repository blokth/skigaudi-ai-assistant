import { onCallGenkit } from "firebase-functions/https";
import { menuSuggestionFlow, faqChatFlow, ai } from "./genkit/flows";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { textembeddingGecko } from "@genkit-ai/vertexai";

export const menuSuggestion = onCallGenkit({}, menuSuggestionFlow);
export const faqChat = onCallGenkit({}, faqChatFlow);

// Keep FAQ docs vectorised
export const faqEmbeddingIndexer = onDocumentWritten(
  { document: "faqs/{docId}", region: "us-central1" },
  async event => {
    const data = event.data?.after?.data();
    if (!data) return;

    const { embedding } = await ai.embed({
      model: textembeddingGecko,
      text: `${data.question}\n${data.answer}`,
    });

    await event.data.after.ref.update({ embedding });
  }
);
