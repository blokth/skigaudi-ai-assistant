import { onCallGenkit } from "firebase-functions/https";
import { REGION } from "./genkit/core";
import { chatFlow } from "./genkit/flows";

export const chat = onCallGenkit(
  {
    region: REGION,
    memory: "512MiB",   // a bit more head-room
    minInstances: 1,    // keep one instance warm
    concurrency: 10,    // let a single instance serve several requests
  },
  chatFlow,
);

export { faqEmbeddingIndexer } from "./faqIndexer";
export { knowledgeDocIndexer, knowledgeDocRemover } from "./knowledgeIndexer";
