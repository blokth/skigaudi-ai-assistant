import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import {
  getExternalTools,
} from "../mcp";


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

    const callerRole = isAdmin ? "ADMIN" : "NORMAL USER";

    const adminToolRules =
      `ADMIN DIRECTIVE – READ FIRST:
When the user explicitly asks to create, update, or delete an FAQ
  • ALWAYS call the matching tool (createFaq, updateFaq, deleteFaq).
  • Do NOT output JSON or natural-language explanations before or
    after the call.`;

    const userToolRules =
      `You must NEVER expose, reference, or describe any admin tools.`;

    const nextContext = { ...context, isAdmin };

    const [_, contextDocs, extTools] = await Promise.all([
      loadSystemPrompt(),
      getContextDocs(history.at(-1)?.content ?? ""),
      getExternalTools(),
    ]);

    const allowedTools = isAdmin ? [...adminTools, ...extTools] : [];

    let sysPrompt = (await loadSystemPrompt())
      .replace(/\{\{CALLER_ROLE\}\}/g, callerRole)
      .replace(
        /\{\{TOOL_RULES\}\}/g,
        isAdmin ? adminToolRules : userToolRules,
      )
      .replace(
        /\{\{ADMIN_STATUS_RULE\}\}/g,
        // kept for future compatibility – remove if not needed in template
        ""
      );

    const docsText =
      contextDocs.length > 0
        ? `\n\nCONTEXT DOCUMENTS:\n${contextDocs
            .map((d: any) => `• ${d.pageContent ?? d.content ?? ""}`)
            .join("\n")}`
        : "";

    const { text } = await ai.generate({
      system: sysPrompt + docsText,
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
