import { genkit, z } from "genkit";
import {
  vertexAI,
  gemini20Flash,
  textEmbedding005
} from "@genkit-ai/vertexai";

// Vector search isn’t implemented in the Firestore emulator.
// Force this process to talk to production so the retriever works.
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn(
    "Vector search not supported in Firestore emulator – falling back to production Firestore."
  );
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

import { defineFirestoreRetriever } from "@genkit-ai/firebase";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp({
    // works in local scripts as well as Cloud Functions
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      "skigaudi-ai-assistant",
  });
}

const ai = genkit({
  plugins: [
    // Load the Vertex AI plugin. You can optionally specify your project ID
    // by passing in a config object; if you don't, the Vertex AI plugin uses
    // the value from the GCLOUD_PROJECT environment variable.
    vertexAI({ location: "us-central1" }),
  ],
});

export { ai };

const faqRetriever = defineFirestoreRetriever(ai, {
  name: "faqRetriever",
  firestore: getFirestore(),
  collection: "faqs",
  contentField: "answer",      // field given to Gemini
  vectorField: "embedding",
  embedder: textEmbedding005,
  distanceMeasure: "DOT_PRODUCT",
});
export { faqRetriever };

const faqChatFlow = ai.defineFlow(
  {
    name: "faqChatFlow",
    inputSchema: z
      .string()
      .describe("A user question for the SkiGaudi FAQ assistant"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (question, { sendChunk }) => {
    // 1. retrieve k-nearest FAQs via Firestore Vector Search
    const docs = await ai.retrieve({
      retriever: faqRetriever,
      query: question,
      options: { k: 5 },   // number of nearest FAQs to return
    });

    // 2. generate the answer, passing the retrieved docs as context
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt: `You are the helpful FAQ assistant for the SkiGaudi student winter festival.
Use only the FAQ content provided to answer the question.
If the answer isn't in the FAQs, reply that you don't have enough information.
Question: ${question}`,
      docs,                       // <- RAG context exactly as in the guide
      config: { temperature: 0.8 },
    });
    for await (const chunk of stream) sendChunk(chunk.text);
    return (await response).text;
  }
);

export { faqChatFlow };
