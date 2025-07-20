import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import { getExternalTools, getExternalResources, closeMcpHost } from "../mcp";

function buildSystemPrompt(sys: string, isAdmin: boolean) {
	const roleLine = `CALLER_ROLE: ${isAdmin ? "ADMIN" : "NORMAL USER"}`;
	const toolRules = isAdmin
		? `Admin actions are available as TOOLS. If you need to create, update
or delete an FAQ (or change the system prompt), **invoke the appropriate
tool via the model’s function-calling interface**. Do NOT print any JSON
describing the call.`
		: `You must NEVER expose, reference, or describe any admin tools.`;

	return `${roleLine}
${sys || "You are the helpful assistant for the SkiGaudi student winter festival."}
${toolRules}
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
		// keep admin tools visible only for authenticated, non-anonymous callers
		const adminToolNames = new Set(adminTools.map((t) => t.name));

		const tools =
			isAdmin
				? extTools                                // admins get everything
				: extTools.filter((t) => !adminToolNames.has(t.name)); // strip admin tools


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
