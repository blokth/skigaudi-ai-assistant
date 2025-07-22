import { defineFirestoreRetriever } from "@genkit-ai/firebase";
import { getFirestore } from "firebase-admin/firestore";
import { ai, EMBEDDER } from "./core";

export const faqRetriever = defineFirestoreRetriever(ai, {
	name: "faqRetriever",
	firestore: getFirestore(),
	collection: "faqs",
	contentField: "answer",
	vectorField: "embedding",
	embedder: EMBEDDER,
});

export const knowledgeRetriever = defineFirestoreRetriever(ai, {
	name: "knowledgeRetriever",
	firestore: getFirestore(),
	collection: "knowledge",
	contentField: "content",
	vectorField: "embedding",
	embedder: EMBEDDER,
});
