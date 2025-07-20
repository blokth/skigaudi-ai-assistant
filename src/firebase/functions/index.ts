import { onCallGenkit } from "firebase-functions/https";
import { faqChatFlow } from "./genkit/flows";



export const faqChat = onCallGenkit({ region: "us-central1" }, faqChatFlow);

// Keep FAQ docs vectorised

export { faqEmbeddingIndexer } from "./faqIndexer";
export { knowledgeDocIndexer } from "./knowledgeIndexer";
export { setSystemPrompt } from "./genkit/flows";

