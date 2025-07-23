import { onCallGenkit } from "firebase-functions/https";
import { REGION } from "./genkit/core";
import { chatFlow } from "./genkit/flows";

export const chat = onCallGenkit(
	{
		region: REGION,
		memory: "2GiB",
	},
	chatFlow,
);

export { faqEmbeddingIndexer } from "./faqIndexer";
export { knowledgeDocIndexer, knowledgeDocRemover } from "./knowledgeIndexer";
