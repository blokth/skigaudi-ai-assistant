import { createMcpHost } from "@genkit-ai/mcp";
import { ai } from "./core";

let host: ReturnType<typeof createMcpHost> | null = null;
function getHost() {
	return (
		host ??
		(host = createMcpHost({
			name: "skigaudi-mcp-host",
			mcpServers: {
				firebase: {
					command: "npx",
					args: ["-y", "firebase-tools@latest", "experimental:mcp"],
				},
			},
		}))
	);
}

export const getExternalTools = () => getHost().getActiveTools(ai);
export const getExternalResources = () => getHost().getActiveResources(ai);
export const closeMcpHost = () => host?.close();
