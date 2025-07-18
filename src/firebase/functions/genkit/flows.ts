// Import the Genkit core libraries and plugins.
import {genkit, z} from "genkit";
import {vertexAI} from "@genkit-ai/vertexai";

// Import models from the Vertex AI plugin. The Vertex AI API provides access to
// several generative models. Here, we import Gemini 2.0 Flash.
import {gemini20Flash} from "@genkit-ai/vertexai";


// The Firebase telemetry plugin exports a combination of metrics, traces, and logs to Google Cloud
// Observability. See https://firebase.google.com/docs/genkit/observability/telemetry-collection.
// import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
// enableFirebaseTelemetry();

const ai = genkit({
  plugins: [
    // Load the Vertex AI plugin. You can optionally specify your project ID
    // by passing in a config object; if you don't, the Vertex AI plugin uses
    // the value from the GCLOUD_PROJECT environment variable.
    vertexAI({location: "us-central1"}),
  ],
});

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
    const prompt = `You are the helpful FAQ assistant for the SkiGaudi student winter festival. Answer the following question clearly and concisely:\n\n${question}`;
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt,
      config: { temperature: 0.8 },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    return (await response).text;
  }
);

export { menuSuggestionFlow, faqChatFlow };
