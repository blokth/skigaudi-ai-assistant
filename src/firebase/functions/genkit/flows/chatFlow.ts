import { z } from "genkit";
import { isAdmin } from "../auth";
import { ai } from "../core";
import { getExternalResources, getExternalTools } from "../mcp";
import { systemPrompt } from "../prompt";
import { faqRetriever, knowledgeRetriever } from "../retrievers";
import { adminTools } from "../tools";

export const chatFlow = ai.defineFlow(
  {
    name: "chatFlow",
    inputSchema: z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "model", "tool", "system"]),
          content: z.array(z.object({ text: z.string() })),
        }),
      ),
    }),
    outputSchema: z.string(),
  },
  async ({ messages }, { context, sendChunk }) => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const query = lastUser?.content[0]?.text ?? "";

    const [[faqs, knowledge], [resources, tools]] = await Promise.all([
      Promise.all([
        ai.retrieve({ retriever: faqRetriever, query }),
        ai.retrieve({ retriever: knowledgeRetriever, query }),
      ]),
      Promise.all([getExternalResources(), getExternalTools()]),
    ]);

    const admin = isAdmin(context);

    const { stream, response } = systemPrompt.stream(
      { query, callerRole: admin ? "ADMIN" : "NORMAL USER" },
      {
        resources,
        docs: [...faqs, ...knowledge],
        tools: admin ? [...tools, ...adminTools] : [],
        messages,
        context,
      },
    );

    for await (const chunk of stream) {
      sendChunk(chunk);
    }

    return (await response).text;
  },
);
