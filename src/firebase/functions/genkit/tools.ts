import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { z } from "genkit";
import { bulkCreatePrompt } from "./prompt";
import { indexFaqDocument } from "../faqIndexer";
import { assertAdmin } from "./auth";
import { ai } from "./core";

const common = { outputSchema: z.string() };

export const createFaq = ai.defineTool(
  {
    name: "createFaq",
    description: "Create a new FAQ entry.",
    inputSchema: z.object({ question: z.string(), answer: z.string() }),
    ...common,
  },
  async ({ question, answer }, { context }) => {
    assertAdmin(context);

    const ref = await getFirestore().collection("faqs").add({
      question,
      answer,
    });
    await indexFaqDocument(await ref.get());
    return `FAQ created with id ${ref.id}`;
  },
);

export const updateFaq = ai.defineTool(
  {
    name: "updateFaq",
    description: "Update an existing FAQ entry.",
    inputSchema: z.object({
      id: z.string(),
      question: z.string().optional(),
      answer: z.string().optional(),
    }),
    ...common,
  },
  async ({ id, ...patch }, { context }) => {
    assertAdmin(context);

    const docRef = getFirestore().collection("faqs").doc(id);
    await docRef.update(patch);
    await indexFaqDocument(await docRef.get());
    return `FAQ ${id} updated.`;
  },
);

export const deleteFaq = ai.defineTool(
  {
    name: "deleteFaq",
    description: "Delete an FAQ entry.",
    inputSchema: z.object({ id: z.string() }),
    ...common,
  },
  async ({ id }, { context }) => {
    assertAdmin(context);

    await getFirestore().collection("faqs").doc(id).delete();
    return `FAQ ${id} deleted.`;
  },
);

export const setSystemPrompt = ai.defineTool(
  {
    name: "setSystemPrompt",
    description: "Change the assistant’s system-prompt.",
    inputSchema: z.object({ content: z.string() }),
    ...common,
  },
  async ({ content }, { context }) => {
    assertAdmin(context);

    if (!content.trim().startsWith("---")) {
      throw new Error(
        "System prompt must be supplied in .prompt (Dotprompt) format " +
        "and start with the '---' YAML front-matter delimiter.",
      );
    }

    await getFirestore()
      .doc("systemPrompts/chatPrompt")
      .set({ content }, { merge: true });
    return "System prompt updated.";
  },
);

export const deleteKnowledgeDoc = ai.defineTool(
  {
    name: "deleteKnowledgeDoc",
    description:
      "Delete a knowledge document from Cloud Storage (e.g. `CV.pdf`). " +
      "All indexed chunks will be removed automatically by the onDelete trigger.",
    inputSchema: z.object({ name: z.string() }),
    ...common,
  },
  async ({ name }, { context }) => {
    assertAdmin(context);

    await getStorage().bucket().file(`knowledge/${name}`).delete();
    return `Knowledge document ${name} deleted.`;
  },
);

export const findFaq = ai.defineTool(
  {
    name: "findFaq",
    description:
      "Search FAQ entries by their question *or* answer text and return every match " +
      "with its Firestore id.  Use this to discover the id before calling updateFaq / deleteFaq.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        question: z.string(),
        answer: z.string(),
      }),
    ),
  },
  async ({ query }, { context }) => {
    assertAdmin(context);

    const q = query.toLowerCase();
    const snap = await getFirestore().collection("faqs").get();

    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q),
      );
  },
);

export const listFaqs = ai.defineTool(
  {
    name: "listFaqs",
    description: "Return every FAQ document (id, question, answer).",
    inputSchema: z.object({}),   // no input needed
    outputSchema: z.array(
      z.object({
        id: z.string(),
        question: z.string(),
        answer: z.string(),
      }),
    ),
  },
  async (_, { context }) => {
    assertAdmin(context);

    const snap = await getFirestore().collection("faqs").get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },
);

export const findKnowledgeDoc = ai.defineTool(
  {
    name: "findKnowledgeDoc",
    description:
      "Search indexed knowledge documents by their textual content and return the " +
      "original filename together with the matched chunk of text.",
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        content: z.string(),
      }),
    ),
  },
  async ({ query }, { context }) => {
    assertAdmin(context);

    const q = query.toLowerCase();
    const snap = await getFirestore().collection("knowledge").get();

    return snap.docs
      .map((d) => d.data() as any)                // { name, content, … }
      .filter((d) => d.content.toLowerCase().includes(q))
      .map((d) => ({ name: d.name, content: d.content }));
  },
);


export const bulkCreateFaq = ai.defineTool(
  {
    name: "bulkCreateFaq",
    description: "Extract Question-Answer pairs from a text block and create FAQs.",
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.string(),
  },
  async ({ text }, { context }) => {
    assertAdmin(context);

    const { output: faqs } = await bulkCreatePrompt({ text });

    const col = getFirestore().collection("faqs");
    for (const { question, answer } of faqs) {
      const ref = await col.add({ question, answer });
      await indexFaqDocument(await ref.get());
    }

    return `Imported ${faqs.length} FAQs.`;
  },
);

export const adminTools = [
  createFaq,
  updateFaq,
  deleteFaq,
  findFaq,
  listFaqs,
  bulkCreateFaq,
  findKnowledgeDoc,
  setSystemPrompt,
  deleteKnowledgeDoc,
];
