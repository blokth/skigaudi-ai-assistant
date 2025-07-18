import { genkit, z } from "genkit";
import { vertexAI, textembeddingGecko } from "@genkit-ai/vertexai";
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
      model: gemini20Flash,
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
    /* ---------- 1. embed the user question ---------- */
    const { embedding: queryVec } = await ai.embed({
      model: textembeddingGecko,
      text: question,
    });

    /* ---------- 2. retrieve similar FAQs (vector search) ---------- */
    const db = getFirestore();
    const snap = await (db as any)
      .collection("faqs")
      .orderBy("embedding", "vector", { vector: queryVec, limit: 5 })
      .select("question", "answer")
      .get();

    const context = snap.docs
      .map(d => {
        const { question, answer } = d.data() as any;
        return `Q: ${question}\nA: ${answer}`;
      })
      .join("\n---\n");

    /* ---------- 3. build prompt & stream Gemini answer ---------- */
    const prompt = `You are the helpful FAQ assistant for the SkiGaudi student winter festival.
Relevant FAQs:
${context}

User question: ${question}
Answer clearly, concisely and reference the relevant FAQ if possible.`;

    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt,
      config: { temperature: 0.8 },
    });
    for await (const chunk of stream) sendChunk(chunk.text);
    return (await response).text;
  }
);

export { menuSuggestionFlow, faqChatFlow };
