import { z } from "genkit";
import { getFirestore } from "firebase-admin/firestore";
import { ai } from "../core";
import { assertAdmin } from "../auth";
import { indexFaqDocument } from "../../faqIndexer";

export const bulkCreateFaq = ai.defineFlow(
  {
    name: "bulkCreateFaq",
    description: "Extract many FAQ pairs from a text blob and store them.",
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.string(),
  },
  async ({ text }, { context }) => {
    // admin-only
    assertAdmin(context);

    // 1. let the model turn the blob into JSON
    const { output: faqs } = await ai.generate({
      model: "vertexai/gemini-2.0-flash",
      prompt:
        "From the text below extract every QUESTION / ANSWER pair and " +
        "return JSON that matches this schema:\n" +
        `[ { "question": string, "answer": string } ]\n\nTEXT:\n` +
        text,
      format: "json",
      schema: z.array(
        z.object({ question: z.string(), answer: z.string() }),
      ),
    });

    // 2. write each FAQ and index it
    const col = getFirestore().collection("faqs");
    for (const { question, answer } of faqs) {
      const ref = await col.add({ question, answer });
      await indexFaqDocument(await ref.get());
    }

    return `Imported ${faqs.length} FAQs.`;
  },
);
