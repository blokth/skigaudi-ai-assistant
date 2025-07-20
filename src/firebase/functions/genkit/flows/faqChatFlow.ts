import { z } from "genkit";
import { gemini20Flash } from "@genkit-ai/vertexai";
import { ai } from "../core";
import { loadSystemPrompt } from "../prompt";
import { getContextDocs } from "./getContextDocs.flow";
import { adminTools } from "../tools";
import { getExternalTools, getExternalResources, closeMcpHost } from "../mcp";

function makePrompt(q: string, sys: string) {
	return `${sys || "You are the helpful assistant for the SkiGaudi student winter festival."}
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
				model: gemini20Flash,
				prompt: makePrompt(question, sysPrompt),
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
