import { getFirestore } from "firebase-admin/firestore";

let cache: { ts: number; txt: string } | null = null;
const TTL = 30_000;

export async function loadSystemPrompt(): Promise<string> {
  if (cache && Date.now() - cache.ts < TTL) return cache.txt;
  const snap = await getFirestore().doc("systemPrompts/chatPrompt").get();
  const txt  = (snap.data()?.content ?? "").trim();
  cache = { ts: Date.now(), txt };
  return txt;
}
