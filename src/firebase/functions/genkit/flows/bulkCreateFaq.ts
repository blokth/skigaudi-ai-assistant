import { z } from "genkit";
import { getFirestore } from "firebase-admin/firestore";
import { ai } from "../core";
import { assertAdmin } from "../auth";
import { indexFaqDocument } from "../../faqIndexer";

export const bulkCreateFaq = ai.defineFlow(
  {
    name: "bulkCreateFaq",
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.string(),
  },
  async ({ text }, { context }) => {
    // admin-only
    assertAdmin(context);

    const { output: faqs } = await ai.prompt('bulkCreate')({ text });

    // 2. write each FAQ and index it
    const col = getFirestore().collection("faqs");
    for (const { question, answer } of faqs) {
      const ref = await col.add({ question, answer });
      await indexFaqDocument(await ref.get());
    }

    return `Imported ${faqs.length} FAQs.`;
  },
);
