import { type DocumentSnapshot, FieldValue } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { ai, EMBEDDER, REGION } from "./genkit/core";

const indexConfig = {
	collection: "faqs",
	vectorField: "embedding",
	embedder: EMBEDDER,
};

/**
 * Embed and index a single FAQ document snapshot.
 * Re-used by the Firestore trigger and the admin CRUD tools so we
 * don’t invoke the Firebase onDocumentWritten handler manually.
 */
export async function indexFaqDocument(snapshot: DocumentSnapshot) {
	const data = snapshot.data();
	if (!data) return;

	const embedding = (
		await ai.embed({
			embedder: indexConfig.embedder,
			content: `${data.question}\n${data.answer}`,
		})
	)[0].embedding;

	await snapshot.ref.update({
		[indexConfig.vectorField]: FieldValue.vector(embedding),
	});
}

export const faqEmbeddingIndexer = onDocumentWritten(
	{ document: "faqs/{docId}", region: REGION },
	async (event) => {
		const after = event.data?.after;
		if (after) await indexFaqDocument(after);
	},
);
