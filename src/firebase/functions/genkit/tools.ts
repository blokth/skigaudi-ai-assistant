import { z } from "genkit";
import { getFirestore } from "firebase-admin/firestore";
import { ai } from "./core";
import { indexFaqDocument } from "../faqIndexer";

/* ─ helper ────────────────────────────────────────────────────────── */
function isAdmin(context: any): boolean {
  // When invoked from Firebase Functions the Auth context is attached
  // to `context.auth` following the Cloud Functions convention.
  // A regular (non-anonymous) sign-in provider of "password" denotes an
  // authenticated admin user in this project.
  if (context?.isAdmin !== undefined) return !!context.isAdmin;

  return context?.auth?.token?.firebase?.sign_in_provider === "password";
}

function assertAdmin(context: any) {
  if (!isAdmin(context)) {
    throw new Error("Permission denied – admin privileges required.");
  }
}

const common = { outputSchema: z.string() };

/* CRUD */
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

export const adminTools = [createFaq, updateFaq, deleteFaq, setSystemPrompt];
