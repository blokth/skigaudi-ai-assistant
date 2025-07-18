import { genkit, z } from "genkit";
import {
  vertexAI,
  textembeddingGecko,
  geminiPro,                 // ✅ real model constant
} from "@genkit-ai/vertexai";
import { defineFirestoreRetriever } from "@genkit-ai/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) admin.initializeApp();

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
  embedder: textembeddingGecko,
  distanceMeasure: "DOT_PRODUCT",
});
export { faqRetriever };

// Define a simple flow that prompts an LLM to generate menu suggestions.
const menuSuggestionFlow = ai.defineFlow({
    name: "menuSuggestionFlow",
    inputSchema: z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  }, async (subject, { sendChunk }) => {
    // Construct a request and send it to the model API.
    const prompt =
      `Suggest an item for the menu of a ${subject} themed restaurant`;
    const { response, stream } = ai.generateStream({
      model: geminiPro,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    // Handle the response from the model API. In this sample, we just
    // convert it to a string, but more complicated flows might coerce the
    // response into structured output or chain the response into another
    // LLM call, etc.
    return (await response).text;
  }
);

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
    const { documents } = await faqRetriever.retrieve({
      query: question,
      topK: 5,
    });

    // 2. assemble context block for RAG
    const context = documents
      .map(d => `Q: ${d.data.question}\nA: ${d.data.answer}`)
      .join("\n---\n");

    // 3. prompt Gemini with context
    const prompt = `You are the helpful FAQ assistant for the SkiGaudi student winter festival.
Relevant FAQs:
${context}

User question: ${question}
Answer clearly, concisely and reference the relevant FAQ if possible.`;

    const { response, stream } = ai.generateStream({
      model: geminiPro,
      prompt,
      config: { temperature: 0.8 },
    });
    for await (const chunk of stream) sendChunk(chunk.text);
    return (await response).text;
  }
);

export { menuSuggestionFlow, faqChatFlow };
