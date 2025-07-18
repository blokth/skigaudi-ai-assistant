"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { httpsCallableFromURL } from "firebase/functions";
import { db, functions } from "@/firebase/client";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<
    { author: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "faqs"));
      setFaqs(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<FAQ, "id">),
        }))
      );
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
      <ul className="space-y-4">
        {faqs.map(faq => (
          <li key={faq.id} className="border rounded-lg overflow-hidden">
            <details className="group">
              <summary className="cursor-pointer px-4 py-3 bg-gray-100 dark:bg-gray-800 font-medium group-open:rounded-b-none">
                {faq.question}
              </summary>
              <div className="px-4 py-3 bg-white dark:bg-gray-900">
                {faq.answer}
              </div>
            </details>
          </li>
        ))}
        {!faqs.length && (
          <p className="text-center text-gray-500">No FAQs yet.</p>
        )}
      </ul>

      {/* Chat with Gemini */}
      <section className="mt-12 border rounded-lg p-4 space-y-4">
        <h2 className="text-2xl font-semibold">Chat with Gemini</h2>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {messages.map((m, idx) => (
            <p
              key={idx}
              className={m.author === "user" ? "text-right" : "text-left"}
            >
              <span
                className={`inline-block px-3 py-2 rounded-lg ${
                  m.author === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              >
                {m.text}
              </span>
            </p>
          ))}
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!input.trim()) return;
            const userText = input;
            setMessages(prev => [...prev, { author: "user", text: userText }]);
            setInput("");
            setSending(true);
            try {
              const callGemini = httpsCallableFromURL(
                functions,
                process.env.NEXT_PUBLIC_FAQ_CHAT_URL!
              );
              const res = await callGemini(userText);       // param is the question string
              const result = res.data as string;
              setMessages(prev => [
                ...prev,
                { author: "ai", text: result },
              ]);
            } catch (err) {
              setMessages(prev => [
                ...prev,
                { author: "ai", text: "Something went wrong." },
              ]);
            } finally {
              setSending(false);
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            className="flex-grow border rounded px-3 py-2"
            placeholder="Ask a question…"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
