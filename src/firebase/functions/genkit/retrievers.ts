import { defineFirestoreRetriever } from "@genkit-ai/firebase";
import { devLocalRetrieverRef } from "@genkit-ai/dev-local-vectorstore";
import { getFirestore } from "firebase-admin/firestore";
import { ai, textEmbedding005, USE_LOCAL_VECTORSTORE } from "./core";

/* FAQ */
export const faqRetriever = USE_LOCAL_VECTORSTORE
  ? devLocalRetrieverRef("faqs")
  : defineFirestoreRetriever(ai, {
      name: "faqRetriever",
      firestore: getFirestore(),
      collection: "faqs",
      contentField: "answer",
      vectorField: "embedding",
      embedder: textEmbedding005,
      distanceMeasure: "DOT_PRODUCT",
    });

/* Knowledge */
export const knowledgeRetriever = USE_LOCAL_VECTORSTORE
  ? devLocalRetrieverRef("knowledge")
  : defineFirestoreRetriever(ai, {
      name: "knowledgeRetriever",
      firestore: getFirestore(),
      collection: "knowledge",
      contentField: "content",
      vectorField: "embedding",
      embedder: textEmbedding005,
      distanceMeasure: "DOT_PRODUCT",
    });
