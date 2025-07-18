import "dotenv/config";
import * as admin from "firebase-admin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { ai } from "../genkit/flows";
import { textembeddingGecko } from "@genkit-ai/vertexai";

admin.initializeApp();
const db = getFirestore();

(async () => {
  const snap = await db.collection("faqs").get();
  for (const d of snap.docs) {
    const data = d.data();
    if (Array.isArray(data.embedding)) {            // old style → re-write
      const { embedding } = await ai.embed({
        model: textembeddingGecko,
        text: `${data.question}\n${data.answer}`,
      });
      await d.ref.update({ embedding: FieldValue.vector(embedding) });
      console.log("fixed", d.id);
    }
  }
})();
