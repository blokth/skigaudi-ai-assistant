import { onCallGenkit } from "firebase-functions/https";
import { chatFlow } from "./genkit/flows";

export const faqChat = onCallGenkit({ region: "us-central1" }, chatFlow);

// Keep FAQ docs vectorised

export { faqEmbeddingIndexer } from "./faqIndexer";
export { setSystemPrompt } from "./genkit/flows";
export { knowledgeDocIndexer } from "./knowledgeIndexer";
