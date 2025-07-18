import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });   // must be first

import { textEmbedding005 } from "@genkit-ai/vertexai";
import { FieldValue } from "firebase-admin/firestore";
import { ai } from "../genkit/flows";
import { getFirestore } from "firebase-admin/firestore";

(async () => {
  const db = getFirestore();
  const snap = await db.collection("faqs").get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.question || !data.answer) continue;

    const embedding =
      (await ai.embed({
        embedder: textEmbedding005,
        content: `${data.question}\n${data.answer}`,
      }))[0].embedding;

    await doc.ref.update({
      embedding: FieldValue.vector(embedding),
    });
  }
})();
