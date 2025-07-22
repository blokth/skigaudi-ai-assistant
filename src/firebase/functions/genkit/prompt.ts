import Handlebars from "handlebars";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Cache compiled template for a short time to avoid unnecessary IO.
 */
const CACHE_TTL = 30_000; // 30 s
let cache: { ts: number; tpl: Handlebars.TemplateDelegate } | null = null;

/**
 * Render the SkiGaudi system prompt.
 *
 * Order of precedence:
 *   1. Firestore document `systemPrompts/chatPrompt`
 *   2. Local `system.prompt` file residing next to the Genkit sources/bundle
 *   3. Local `system.prompt` from repo root or `functions/` folder
 */
export async function renderSystemPrompt(vars: {
  callerRole: string;
  toolRules: string;
  contextDocs?: string;
}): Promise<string> {
  // serve from cache if still fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.tpl(vars);
  }

  // fetch prompt text
  const promptText =
    (await loadFromFirestore()) ??
    readFileSync(resolvePromptPath(), "utf8");

  // remove YAML front-matter (`--- … ---`)
  const templateBody = stripFrontMatter(promptText);

  // compile & cache
  const tpl = Handlebars.compile(templateBody, { noEscape: true });
  cache = { ts: Date.now(), tpl };

  return tpl(vars);
}

/* -------------------------------------------------------------------------- */

async function loadFromFirestore(): Promise<string | null> {
  const snap = await getFirestore().doc("systemPrompts/chatPrompt").get();
  const content = (snap.data()?.content ?? "").trim();
  return content || null;
}

function resolvePromptPath(): string {
  const candidates = [
    // compiled or ts-node execution
    resolve(__dirname, "..", "system.prompt"),
    // repo root execution
    resolve(process.cwd(), "src/firebase/functions/system.prompt"),
    // inside functions/ folder
    resolve(process.cwd(), "system.prompt"),
  ];

  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "Cannot locate system.prompt – checked:\n" + candidates.join("\n"),
    );
  }
  return found;
}

function stripFrontMatter(txt: string): string {
  const frontMatter = /^---[\s\S]*?---\s*/;
  if (!frontMatter.test(txt)) {
    throw new Error("System prompt must contain YAML front-matter.");
  }
  return txt.replace(frontMatter, "");
}
