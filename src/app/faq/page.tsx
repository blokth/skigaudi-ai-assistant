"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebase/client";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import { MessageCircle } from "lucide-react";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function FAQPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<
    { author: "user" | "ai"; text: string }[]
  >([]);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");

  const sectionClass =
    "mb-8 space-y-4 p-6 rounded-xl bg-white/60 dark:bg-gray-800/50 " +
    "backdrop-blur ring-1 ring-gray-200 dark:ring-gray-700";

  useEffect(() => { loadFaqs(); }, []);

  // admin helpers
  const loadFaqs = async () => {
    const snap = await getDocs(collection(db, "faqs"));
    setFaqs(
      snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<FAQ, "id">),
      }))
    );
    setLoading(false);
  };

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // accept only PDF, TXT or MD
    if (
      !["application/pdf", "text/plain", "text/markdown"].includes(file.type) &&
      !/\.(pdf|txt|md)$/i.test(file.name)
    ) {
      setUploadError("Unsupported file type.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const storageRef = ref(storage, `knowledge/${file.name}`);
      await uploadBytes(storageRef, file);
      alert("File uploaded successfully and will be processed shortly.");
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Chat send handler
  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;
    setMessages(prev => [...prev, { author: "user", text: userText }]);
    setSending(true);
    try {
      const callGemini = httpsCallable(functions, "faqChat");
      const res = await callGemini(userText);
      const result = res.data as string;
      setMessages(prev => [...prev, { author: "ai", text: result }]);
    } catch {
      setMessages(prev => [...prev, { author: "ai", text: "Something went wrong." }]);
    } finally {
      setSending(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>

      {/* Admin: Add new FAQ */}
      {isAdmin && (
        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">Add new FAQ</h2>
          <input
            type="text"
            placeholder="Question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600
                       rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <textarea
            placeholder="Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600
                       rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 h-24"
          />
          <button
            onClick={createFaq}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </section>
      )}

      {/* Admin: Upload knowledge document */}
      {isAdmin && (
        <section className={sectionClass}>
          <h2 className="text-2xl font-semibold">Upload knowledge document</h2>
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600
                       rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          {uploading && <p className="text-sm">Uploading…</p>}
        </section>
      )}

      <ul className="space-y-4">
        {faqs.map(faq => (
          <li key={faq.id} className="rounded-xl overflow-hidden bg-white/70 dark:bg-gray-800/60
                                     backdrop-blur ring-1 ring-gray-200 dark:ring-gray-700">
            <details className="group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer
                                  text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                {faq.question}
              </summary>
              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700">
                {faq.answer}
                {isAdmin && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editFaq(faq)}
                      className="px-3 py-1 rounded-md bg-yellow-400 text-black text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeFaq(faq.id)}
                      className="px-3 py-1 rounded-md bg-red-600 text-white text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
        {!faqs.length && (
          <p className="text-center text-gray-500">No FAQs yet.</p>
        )}
      </ul>

      {/* floating chat button */}
      <button
        onClick={() => setShowChat(p => !p)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sky-600
                   text-white flex items-center justify-center shadow-lg"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* chat panel */}
      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-72 md:w-96 h-[32rem]">
          <MainContainer responsive>
            <ChatContainer>
              <MessageList>
                {messages.map((m, i) => (
                  <Message
                    key={i}
                    model={{
                      message: m.text,
                      direction: m.author === "user" ? "outgoing" : "incoming",
                    }}
                  />
                ))}
              </MessageList>
              <MessageInput
                placeholder="Ask a question…"
                attachButton={false}
                onSend={handleSend}
                disabled={sending}
              />
            </ChatContainer>
          </MainContainer>
        </div>
      )}
    </main>
  );
}
