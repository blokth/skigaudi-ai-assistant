import { genkit } from "genkit";
import { vertexAI, textEmbedding005 } from "@genkit-ai/vertexai";
import { devLocalVectorstore } from "@genkit-ai/dev-local-vectorstore";
import * as admin from "firebase-admin";

/* ─ setup ─────────────────────────────────────────────── */
export const USE_LOCAL_VECTORSTORE =
	process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
	!!process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
	admin.initializeApp({
		projectId:
			process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
			process.env.GOOGLE_CLOUD_PROJECT ||
			"skigaudi-ai-assistant",
	});
}

/* ─ Genkit instance ───────────────────────────────────── */
export const ai = genkit({
	plugins: [
		vertexAI({ location: "us-central1" }),
		...(USE_LOCAL_VECTORSTORE
			? [
					devLocalVectorstore([
						{ indexName: "faqs", embedder: textEmbedding005 },
						{ indexName: "knowledge", embedder: textEmbedding005 },
					]),
				]
			: []),
	],
});

export { textEmbedding005 };
