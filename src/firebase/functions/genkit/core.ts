import { gemini20Flash, textEmbedding005, vertexAI } from "@genkit-ai/vertexai";
import * as admin from "firebase-admin";
import { genkit } from "genkit";

export const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const storageBucket =
	process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
	`${projectId}.appspot.com`;

export const REGION = "us-central1";

if (!admin.apps.length) {
	admin.initializeApp({
		projectId,
		storageBucket,          // <-- sets default bucket
	});
}

export const ai = genkit({
	plugins: [vertexAI()],
	model: gemini20Flash,
});

export { textEmbedding005 as EMBEDDER };
