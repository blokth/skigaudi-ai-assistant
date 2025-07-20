import { z } from "genkit";
import { Document } from "genkit/retriever";
import { ai } from "../core";
import { faqRetriever, knowledgeRetriever } from "../retrievers";

export const getContextDocs = ai.defineFlow(
  { name: "getContextDocs", inputSchema: z.string(), outputSchema: z.array(Document) },
  async (q) => {
    const [faq, knowledge] = await Promise.all([
      ai.retrieve({ retriever: faqRetriever,      query: q, options: { k: 4 } }),
      ai.retrieve({ retriever: knowledgeRetriever, query: q, options: { k: 4 } }),
    ]);
    return [...faq, ...knowledge];
  }
);
