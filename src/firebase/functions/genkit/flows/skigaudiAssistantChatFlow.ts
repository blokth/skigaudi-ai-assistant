import { z } from "genkit";
import { ai } from "../core";
import { faqRetriever, knowledgeRetriever } from "../retrievers";
import { adminTools } from "../tools";

/**
 * Very small helper – mirrors the logic used in tools.ts.
 */
function isAdmin(context: any): boolean {
  return (
    context?.auth?.token?.admin === true ||
    context?.auth?.token?.firebase?.sign_in_provider === "password"
  );
}

/**
 * Main chat flow for the Skigaudi assistant.
 * – Retrieves context from FAQ & knowledge bases (RAG).
 * – Exposes admin-only tools when caller is an admin.
 */
export const skigaudiAssistantChatFlow = ai.defineFlow(
  {
    name: "skigaudiAssistantChatFlow",
    description:
      "Chat with the Skigaudi assistant using RAG and, for admins, the full tool set.",
    inputSchema: z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "model", "tool"]),
          content: z.string(),
        }),
      ),
    }),
    outputSchema: z.string(),
  },
  async ({ messages }, { context }) => {
    // latest user message drives retrieval
    const latestUserMsg =
      [...messages]
        .reverse()
        .find((m) => m.role === "user")?.content ?? "";

    // fetch relevant docs in parallel
    const [faqDocs, knowledgeDocs] = await Promise.all([
      ai.retrieve({
        retriever: faqRetriever,
        query: latestUserMsg,
        options: { k: 4 },
      }),
      ai.retrieve({
        retriever: knowledgeRetriever,
        query: latestUserMsg,
        options: { k: 4 },
      }),
    ]);

    // spin up chat with optional tools & docs attached
    const chat = ai.chat({
      system:
        "You are the Skigaudi assistant. Answer clearly and concisely. Use Markdown where appropriate.",
      messages,
      docs: [...faqDocs, ...knowledgeDocs],
      tools: isAdmin(context) ? adminTools : undefined,
      context, // propagate auth etc.
    });

    const { text } = await chat.send({ prompt: latestUserMsg });
    return text;
  },
);
