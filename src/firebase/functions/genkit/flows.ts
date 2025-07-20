import { genkit, z } from "genkit";
import { mcp } from "@genkit-ai/mcp";
import {
  vertexAI,
  gemini20Flash,
  textEmbedding005
} from "@genkit-ai/vertexai";
import { getFirestore } from "firebase-admin/firestore";
import { indexFaqDocument } from "../faqIndexer";

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
    mcp(), // NEW
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

/* ─────────────  FAQ CRUD tools ───────────── */
const createFaq = ai.defineTool(
  {
    name: "createFaq",
    description: "Create a new FAQ entry.",
    inputSchema: z.object({
      question: z.string().describe("The FAQ question"),
      answer:   z.string().describe("The answer"),
    }),
    outputSchema: z.string(),
  },
  async ({ question, answer }) => {
    const ref = await getFirestore().collection("faqs").add({ question, answer });

    // immediately vector-index so the new FAQ is searchable before the trigger runs
    await indexFaqDocument(await ref.get());

    return `FAQ created with id ${ref.id}`;
  }
);

const updateFaq = ai.defineTool(
  {
    name: "updateFaq",
    description: "Update an existing FAQ entry.",
    inputSchema: z.object({
      id:       z.string().describe("Firestore document id"),
      question: z.string().optional(),
      answer:   z.string().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ id, question, answer }) => {
    const docRef = getFirestore().collection("faqs").doc(id);
    const data: Record<string, unknown> = {};
    if (question !== undefined) data.question = question;
    if (answer   !== undefined) data.answer   = answer;

    await docRef.update(data);

    // refresh embedding so retrieval sees the updated text
    await indexFaqDocument(await docRef.get());

    return `FAQ ${id} updated.`;
  }
);

const deleteFaq = ai.defineTool(
  {
    name: "deleteFaq",
    description: "Delete an FAQ entry.",
    inputSchema: z.object({ id: z.string() }),
    outputSchema: z.string(),
  },
  async ({ id }) => {
    await getFirestore().collection("faqs").doc(id).delete();
    return `FAQ ${id} deleted.`;
  }
);

const setSystemPrompt = ai.defineTool(
  {
    name: "setSystemPrompt",
    description: "Change the chat assistant’s system-prompt text.",
    inputSchema : z.object({
      content: z.string().describe("The new system-prompt"),
    }),
    outputSchema: z.string(),
  },
  async ({ content }) => {
    await getFirestore()
      .doc("systemPrompts/chatPrompt")
      .set({ content }, { merge: true });
    return "System prompt updated.";
  }
);
export { createFaq, updateFaq, deleteFaq };      // NEW
export { setSystemPrompt };          // NEW

async function loadSystemPrompt(): Promise<string> {
  const snap = await getFirestore().doc("systemPrompts/chatPrompt").get();
  return (snap.data()?.content ?? "").trim();
}

const faqChatFlow = ai.defineFlow(
  {
    name: "faqChatFlow",
    inputSchema: z
      .string()
      .describe("A user question for the SkiGaudi FAQ assistant"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (question, { sendChunk, context }) => {
    // 0. get dynamic system-prompt
    const systemPrompt = await loadSystemPrompt();

    // 1. vector-retrieve context docs
    const faqDocs = await ai.retrieve({ retriever: faqRetriever, query: question, options: { k: 4 } });
    const knowledgeDocs = await ai.retrieve({ retriever: knowledgeRetriever, query: question, options: { k: 4 } });
    const docs = [...faqDocs, ...knowledgeDocs];

    // 2. expose CRUD tools only for authenticated non-anonymous users
    const isAdmin =
      context?.auth?.token?.firebase?.sign_in_provider !== "anonymous";
    const tools   = isAdmin ? [createFaq, updateFaq, deleteFaq, setSystemPrompt] : [];

    // 3. generate answer / handle tool-calls
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt: `${systemPrompt || "You are the helpful assistant for the SkiGaudi student winter festival."}
Use the provided FAQ answers and knowledge documents as context to answer or act.
If the answer isn't covered, reply that you don't have enough information.
Question: ${question}`,
      docs,
      tools,
      config: { temperature: 0.8 },
    });

    for await (const chunk of stream) sendChunk(chunk.text);
    return (await response).text;
  }
);

export { faqChatFlow };
