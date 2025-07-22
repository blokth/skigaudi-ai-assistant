import { gemini20Flash, textEmbedding005, vertexAI } from "@genkit-ai/vertexai";
import * as admin from "firebase-admin";
import { genkit } from "genkit";

export const projectId = process.env.FIREBASE_PROJECT_ID;

const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ??
  `gs://${projectId}.firebasestorage.app`;

export const REGION = "us-central1";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
    storageBucket,
  });
}

export const ai = genkit({
  plugins: [vertexAI()],
  model: gemini20Flash,
});

export { textEmbedding005 as EMBEDDER };
