"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/client";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

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
    </main>
  );
}
