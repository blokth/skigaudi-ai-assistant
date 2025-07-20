import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";          // NEW
import { getExternalTools, getExternalResources, closeMcpHost } from "../mcp";

function buildSystemPrompt(sys: string, isAdmin: boolean) {
	const roleLine = `CALLER_ROLE: ${isAdmin ? "ADMIN" : "NORMAL USER"}`;
	const toolRules = isAdmin
		? `ADMIN DIRECTIVE – READ FIRST:
When the user explicitly asks to create, update, or delete an FAQ
  • ALWAYS call the matching tool (createFaq, updateFaq, deleteFaq)
    via the model’s function-calling / function-calling interface.
  • Do NOT output JSON or natural-language explanations before or
    after the call. Simply invoke the tool.`
		: `You must NEVER expose, reference, or describe any admin tools.`;

	const adminStatusRule = `ADMIN-STATUS DISCLOSURE:
If the user asks “Am I an admin?” or similar, answer
“yes” when CALLER_ROLE is ADMIN and “no” when it is NORMAL USER.`;

	// place our rules *after* the stored prompt so they override it
	return `${roleLine}
${sys || "You are the helpful assistant for the SkiGaudi student winter festival."}
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
			z.object({
				role: z.enum(["user", "model"]),
				content: z.string(),
			}),
		),
		outputSchema: z.string(),
		streamSchema: z.string(),
	},
	async (messages, { context }) => {
		const question =
			messages.length > 0 ? messages[messages.length - 1].content : "";
		const sysPrompt = await loadSystemPrompt();
		const docs = await getContextDocs(question);

		const extTools = await getExternalTools();
		const resources = await getExternalResources();

		const isAdmin =
			context?.auth?.token?.firebase?.sign_in_provider !== "anonymous";
		// Admins can use all FAQ-maintenance tools; normal users get none.
		const tools = isAdmin ? [...adminTools, ...extTools] : [];


		try {
			const genkitMessages = messages.map((m) => ({
				role: m.role,               // "user" | "model"
				content: [{ text: m.content }],
			}));

			const { text } = await ai.generate({
				system: buildSystemPrompt(sysPrompt, isAdmin),
				messages: genkitMessages,    // entire conversation (proper shape)
				docs,
				tools,
				resources,
				config: { temperature: 0.8 },
			});
			return text;
		} finally {
			await closeMcpHost();
		}
	},
);
