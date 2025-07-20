import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getFirestore } from "firebase-admin/firestore";

let cache: { ts: number; template: Handlebars.TemplateDelegate } | null = null;
const TTL = 30_000;

// change export name
export async function renderSystemPrompt(
  vars: { callerRole: string; toolRules: string; contextDocs?: string },
): Promise<string> {
  if (cache && Date.now() - cache.ts < TTL && cache.template) {
    return cache.template(vars);
  }

  // 1) try Firestore override
  const snap = await getFirestore().doc("systemPrompts/chatPrompt").get();
  let txt = (snap.data()?.content ?? "").trim();

  // 2) fall back to repo default
  if (!txt) {
    const fp = path.join(
      __dirname,
      "../../../prompts/faqSystem.prompt", // adjust only if you move the prompt dir
    );
    txt = readFileSync(fp, "utf8").trim();
  }

  // 3) basic dotprompt-format assertion
  if (!txt.startsWith("---"))
    throw new Error(
      "System prompt must be valid .prompt content (missing YAML front-matter).",
    );

  // After obtaining `txt` (the full .prompt file contents) …
  const secondDash = txt.indexOf("---", 3);
  if (secondDash === -1) throw new Error("Malformed .prompt file.");

  const templateStr = txt.slice(secondDash + 3).trimStart();
  const compiled =
    cache && cache.template
      ? cache.template
      : Handlebars.compile(templateStr, { noEscape: true });

  cache = { ts: Date.now(), template: compiled };
  return compiled(vars);
}
