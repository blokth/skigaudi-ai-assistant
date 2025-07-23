import "dotenv/config";

import { gemini20Flash, textEmbedding005, vertexAI } from "@genkit-ai/vertexai";
import * as admin from "firebase-admin";
import { genkit } from "genkit";

export const REGION = process.env.APP_REGION;
export const PROJECT_ID = process.env.APP_PROJECT_ID;

if (!admin.apps.length) {
	admin.initializeApp({
		projectId: PROJECT_ID,
	});
}

export const ai = genkit({
	plugins: [vertexAI()],
	model: gemini20Flash,
});

export { textEmbedding005 as EMBEDDER };
