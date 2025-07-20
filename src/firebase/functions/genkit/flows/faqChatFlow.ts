import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import {
  getExternalTools,
  getExternalResources,
  closeMcpHost,
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
    const question =
      history.length > 0 ? history[history.length - 1].content : "";

    const sysPrompt   = await loadSystemPrompt();
    const docs        = await getContextDocs(question);
    const resources   = await getExternalResources();
    const extTools    = await getExternalTools();

    /* ───────── auth ───────── */
    const isAdmin =
      context?.auth?.token?.firebase?.sign_in_provider === "password";

    /* ───────── tool gate ───── */
    // Only expose/run tools when caller is ADMIN
    const allowedTools = isAdmin ? [...adminTools, ...extTools] : [];

    /* ───────── messages ────── */
    const llmMsgs = history.map((m) => ({
      role: m.role,                 //   "user" | "model"
      content: [{ text: m.content }],
    }));

    /* ───────── generation loop with manual tool handling ───────── */
    const opts: Parameters<typeof ai.generate>[0] = {
      system: buildSystemPrompt(sysPrompt, isAdmin),
      messages: llmMsgs,
      docs,
      resources,
      tools: allowedTools,
      maxTurns: 5,
      returnToolRequests: true, // we will decide if they run
      context,                  // ← propagate auth to tools
      config: { temperature: 0.8 },
    };

    try {
      // loop until the model stops asking for tools
      /* eslint-disable no-constant-condition */
      while (true) {
        const { text, messages, toolRequests } = await ai.generate(opts);

        // Normal completion – no tool calls requested
        if (!toolRequests?.length) return text;

        // Not admin → never execute tools, just refuse
        if (!isAdmin) {
          return "Sorry, you don't have permission to perform that action.";
        }

        // Admin → execute requested tools and feed results back
        const toolResponses = await Promise.all(
          toolRequests.map(async (part) => {
            const toolImpl = allowedTools.find(
              (t) => t.name === part.toolRequest.name,
            );
            if (!toolImpl)
              return {
                toolResponse: {
                  name: part.toolRequest.name,
                  ref: part.toolRequest.ref,
                  output: "Tool not available.",
                },
              };

            const output = await (toolImpl as any)(
              part.toolRequest.input,
              { context },
            );
            return {
              toolResponse: {
                name: part.toolRequest.name,
                ref: part.toolRequest.ref,
                output,
              },
            };
          }),
        );

        // Continue the loop with the new messages + tool results
        opts.messages = messages;
        opts.prompt   = toolResponses;
      }
    } finally {
      await closeMcpHost();
    }
  },
);
