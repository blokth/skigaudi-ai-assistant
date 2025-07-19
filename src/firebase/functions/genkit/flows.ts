import { genkit, z } from "genkit";
import {
  vertexAI,
  gemini20Flash,
  textEmbedding005
} from "@genkit-ai/vertexai";

// Vector search isn’t implemented in the Firestore emulator.
// Force this process to talk to production so the retriever works.
const USE_LOCAL_VECTORSTORE =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  !!process.env.FIRESTORE_EMULATOR_HOST;

// Vector search isn’t implemented in the Firestore emulator.
// If we're *not* using the local vector store, fall back to production
// Firestore so the retriever continues to work.
if (!USE_LOCAL_VECTORSTORE && process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn(
    "Vector search not supported in Firestore emulator – falling back to production Firestore."
  );
  delete process.env.FIRESTORE_EMULATOR_HOST;
}

import { defineFirestoreRetriever } from "@genkit-ai/firebase";
import { devLocalVectorstore, devLocalRetrieverRef } from "@genkit-ai/dev-local-vectorstore";
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
    ...(USE_LOCAL_VECTORSTORE
      ? [
          devLocalVectorstore([
            {
              indexName: "faqs",
              embedder: textEmbedding005,
            },
            {
              indexName: "knowledge",
              embedder: textEmbedding005,
            },
          ]),
        ]
      : []),
  ],
});

export { ai };

const faqRetriever = USE_LOCAL_VECTORSTORE
  ? devLocalRetrieverRef("faqs")
  : defineFirestoreRetriever(ai, {
      name: "faqRetriever",
      firestore: getFirestore(),
      collection: "faqs",
      contentField: "answer",      // field given to Gemini
      vectorField: "embedding",
      embedder: textEmbedding005,
      distanceMeasure: "DOT_PRODUCT",
    });
export { faqRetriever };

const knowledgeRetriever = USE_LOCAL_VECTORSTORE
  ? devLocalRetrieverRef("knowledge")
  : defineFirestoreRetriever(ai, {
      name: "knowledgeRetriever",
      firestore: getFirestore(),
      collection: "knowledge",
      contentField: "content",      // full document text
      vectorField: "embedding",
      embedder: textEmbedding005,
      distanceMeasure: "DOT_PRODUCT",
    });
export { knowledgeRetriever };

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
    // 1. retrieve nearest FAQs and knowledge docs via vector search
    const faqDocs = await ai.retrieve({
      retriever: faqRetriever,
      query: question,
      options: { k: 4 },
    });
    const knowledgeDocs = await ai.retrieve({
      retriever: knowledgeRetriever,
      query: question,
      options: { k: 4 },
    });
    const docs = [...faqDocs, ...knowledgeDocs];

    // 2. generate the answer, passing the retrieved docs as context
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt: `You are the helpful assistant for the SkiGaudi student winter festival.
Use the provided FAQ answers and knowledge documents as context to answer the question.
If the answer isn't covered, reply that you don't have enough information.
Question: ${question}`,
      docs,                       // <- RAG context exactly as in the guide
      config: { temperature: 0.8 },
    });
    for await (const chunk of stream) sendChunk(chunk.text);
    return (await response).text;
  }
);

export { faqChatFlow };
