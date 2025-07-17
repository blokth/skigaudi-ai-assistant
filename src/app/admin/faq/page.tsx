"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function AdminFAQ() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // load faqs
  const loadFaqs = async () => {
    const snap = await getDocs(collection(db, "faqs"));
    setFaqs(
      snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<FAQ, "id">),
      }))
    );
  };
  useEffect(() => {
    if (user) loadFaqs();
  }, [user]);

  const createFaq = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "faqs"), { question, answer });
    setQuestion("");
    setAnswer("");
    await loadFaqs();
    setSaving(false);
  };

  const editFaq = async (faq: FAQ) => {
    const q = prompt("Question:", faq.question);
    if (q == null) return;
    const a = prompt("Answer:", faq.answer);
    if (a == null) return;
    setSaving(true);
    await updateDoc(doc(db, "faqs", faq.id), { question: q, answer: a });
    await loadFaqs();
    setSaving(false);
  };

  const removeFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    setSaving(true);
    await deleteDoc(doc(db, "faqs", id));
    await loadFaqs();
    setSaving(false);
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold">Manage FAQs</h1>

      <section className="border rounded-lg p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Add new FAQ</h2>
        <input
          type="text"
          placeholder="Question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          placeholder="Answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          className="w-full border rounded px-3 py-2 h-24"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={createFaq}
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Existing FAQs</h2>
        {faqs.length ? (
          <ul className="space-y-2">
            {faqs.map(faq => (
              <li
                key={faq.id}
                className="border rounded-lg flex justify-between items-start p-4"
              >
                <div>
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editFaq(faq)}
                    className="px-3 py-1 rounded bg-yellow-400 text-black text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeFaq(faq.id)}
                    className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No FAQs yet.</p>
        )}
      </section>
    </main>
  );
}
