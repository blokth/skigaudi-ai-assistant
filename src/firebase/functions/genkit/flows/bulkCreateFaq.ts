import { z } from "genkit";
import { getFirestore } from "firebase-admin/firestore";
import { ai } from "../core";
import { assertAdmin } from "../auth";
import { indexFaqDocument } from "../../faqIndexer";
import { bulkCreatePrompt } from "../prompt";

export const bulkCreateFaq = ai.defineFlow(
  {
    name: "bulkCreateFaq",
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.string(),
  },
  async ({ text }, { context }) => {
    assertAdmin(context);

    const { output: faqs } = await bulkCreatePrompt({ text });

    const col = getFirestore().collection("faqs");
    for (const { question, answer } of faqs) {
      const ref = await col.add({ question, answer });
      await indexFaqDocument(await ref.get());
    }

    return `Imported ${faqs.length} FAQs.`;
  },
);
