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
    const query =
      messages
        .reverse()
        .find(({ role }) => role === "user")
        ?.content.at(0)?.text ?? "";

    const [faqs, knowledge] = await Promise.all([
      ai.retrieve({
        retriever: faqRetriever,
        query,
      }),
      ai.retrieve({
        retriever: knowledgeRetriever,
        query,
      }),
    ]);

    const resources = await getExternalResources();
    const tools = await getExternalTools();

    const admin = isAdmin(context);

    const { stream, response } = systemPrompt.stream(
      { query, role: admin ? "ADMIN" : "NORMAL USER" },
      {
        resources,
        docs: [...faqs, ...knowledge],
        tools: admin ? [...tools, ...adminTools] : [],
        messages: messages,
        context,
      });

    for await (const chunk of stream) {
      sendChunk(chunk);
    }

    return (await response).text;
  },
);
