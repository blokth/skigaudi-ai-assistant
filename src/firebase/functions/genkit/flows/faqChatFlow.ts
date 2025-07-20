import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import {
  getExternalTools,
} from "../mcp";

function buildSystemPrompt(stored: string, isAdmin: boolean) {
  const toolRules = isAdmin
    ? `ADMIN DIRECTIVE – READ FIRST:
When the user explicitly asks to create, update, or delete an FAQ
  • ALWAYS call the matching tool (createFaq, updateFaq, deleteFaq).
  • Do NOT output JSON or natural-language explanations before or
    after the call.`
    : `You must NEVER expose, reference, or describe any admin tools.`;

  const adminStatusRule = `ADMIN-STATUS DISCLOSURE:
If the user asks “Am I an admin?” (or similar) answer
“yes” when CALLER_ROLE is ADMIN and “no” when it is NORMAL USER.`;

  return `${stored || "You are the helpful assistant for the SkiGaudi student winter festival."}

CALLER_ROLE: ${isAdmin ? "ADMIN" : "NORMAL USER"}
${toolRules}
${adminStatusRule}

Use the provided FAQ answers and knowledge documents as context to answer or act.
If the answer isn't covered, reply that you don't have enough information.
`;
}

export const faqChatFlow = ai.defineFlow(
  {
    name: "faqChatFlow",
    inputSchema: z.array(
      z.object({ role: z.enum(["user", "model"]), content: z.string() }),
    ),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (history, { context }) => {
    const isAdmin =
      context?.auth?.token?.firebase?.sign_in_provider === "password";

    const nextContext = { ...context, isAdmin };

    const [sysPrompt, contextDocs, extTools] = await Promise.all([
      loadSystemPrompt(),
      getContextDocs(history.at(-1)?.content ?? ""),
      getExternalTools(),
    ]);

    const allowedTools = isAdmin ? [...adminTools, ...extTools] : [];

    const docsText =
      contextDocs.length > 0
        ? `\n\nCONTEXT DOCUMENTS:\n${contextDocs
            .map((d: any) => `• ${d.pageContent ?? d.content ?? ""}`)
            .join("\n")}`
        : "";

    const { text } = await ai.generate({
      system: buildSystemPrompt(sysPrompt, isAdmin) + docsText,
      messages: history.map((m) => ({
        role: m.role as "user" | "model",
        content: [{ text: m.content }],
      })),
      tools: allowedTools,
      maxTurns: 5,
      context: nextContext,
      config: { temperature: 0.8 },
    });

    return text;
  },
);
