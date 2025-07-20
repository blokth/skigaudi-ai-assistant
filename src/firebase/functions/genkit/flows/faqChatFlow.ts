import { z } from "genkit";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import { getExternalTools, getExternalResources, closeMcpHost } from "../mcp";

function makePrompt(q: string, sys: string, isAdmin: boolean) {
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
Question: ${q}`;
}

export const faqChatFlow = ai.defineFlow(
	{
		name: "faqChatFlow",
		inputSchema: z.string(),
		outputSchema: z.string(),
		streamSchema: z.string(),
	},
	async (question, { context }) => {
		const sysPrompt = await loadSystemPrompt();
		const docs = await getContextDocs(question);

		const extTools = await getExternalTools();
		const resources = await getExternalResources();

		const isAdmin =
			context?.auth?.token?.firebase?.sign_in_provider !== "anonymous";
		const tools = [...extTools, ...(isAdmin ? adminTools : [])];


		try {
			const { text } = await ai.generate({
				prompt: makePrompt(question, sysPrompt, isAdmin),
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
