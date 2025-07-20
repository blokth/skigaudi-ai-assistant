import { readFileSync } from "node:fs";
import path from "node:path";
import { getFirestore } from "firebase-admin/firestore";

let cache: { ts: number; txt: string } | null = null;
const TTL = 30_000;

export async function loadSystemPrompt(): Promise<string> {
  if (cache && Date.now() - cache.ts < TTL) return cache.txt;

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

  // 4) strip front-matter, return only the template body
  const secondDash = txt.indexOf("---", 3);
  if (secondDash === -1)
    throw new Error("Malformed .prompt file – closing '---' not found.");

  const body = txt.slice(secondDash + 3).trimStart();

  cache = { ts: Date.now(), txt: body };
  return body;
}
