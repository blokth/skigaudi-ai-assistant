"use client";

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase/client";

type FAQ = {
	id: string;
	question: string;
	answer: string;
};

export default function FAQPage() {
	const { isAdmin, loading: authLoading } = useAuth();

	const [faqs, setFaqs] = useState<FAQ[]>([]);
	const [loading, setLoading] = useState(true);

	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState("");
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState("");

	const [sysPrompt, setSysPrompt] = useState("");
	const [sysSaving, setSysSaving] = useState(false);

	const sectionClass = "space-y-4 p-6 bg-card/60 border rounded-xl";

	// admin helpers
	const loadFaqs = useCallback(async () => {
		const snap = await getDocs(collection(db, "faqs"));
		setFaqs(
			snap.docs.map((d) => ({
				id: d.id,
				...(d.data() as Omit<FAQ, "id">),
			})),
		);
		setLoading(false);
	}, []);

	const loadSysPrompt = useCallback(async () => {
		const snap = await getDoc(doc(db, "systemPrompts", "chatPrompt"));
		const data = snap.data() as { content?: string } | undefined;
		setSysPrompt(snap.exists() ? data?.content ?? "" : "");
	}, []);

	useEffect(() => {
		loadFaqs();
		loadSysPrompt();
	}, [loadFaqs, loadSysPrompt]);

	const saveSysPrompt = async () => {
		if (!isAdmin) return;
		setSysSaving(true);
		await setDoc(doc(db, "systemPrompts", "chatPrompt"), {
			content: sysPrompt,
			updatedAt: serverTimestamp(),
		});
		setSysSaving(false);
		alert("System prompt saved");
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

	if (loading || authLoading) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				Loading…
			</main>
		);
	}

	return (
		<main className="min-h-screen flex flex-col items-center px-4 py-16">
			<h1 className="text-4xl md:text-5xl font-bold text-center mt-10 mb-14">
				Frequently Asked Questions
			</h1>
			<div className="w-full max-w-2xl space-y-12">

				{/* Admin: Edit system prompt */}
				{isAdmin && (
					<section className={sectionClass}>
						<h2 className="text-2xl font-semibold">System prompt</h2>
						<Textarea
							value={sysPrompt}
							onChange={(e) => setSysPrompt(e.target.value)}
							style={{ height: "8rem" }}
						/>
						<Button
							variant="secondary"
							onClick={saveSysPrompt}
							disabled={sysSaving}
						>
							{sysSaving ? "Saving…" : "Save prompt"}
						</Button>
					</section>
				)}

				{/* Admin: Add new FAQ */}
				{isAdmin && (
					<section className={sectionClass}>
						<h2 className="text-2xl font-semibold">Add new FAQ</h2>
						<Input
							type="text"
							placeholder="Question"
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
						/>
						<Textarea
							placeholder="Answer"
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							style={{ height: "6rem" }}
						/>
						<Button variant="secondary" onClick={createFaq} disabled={saving}>
							{saving ? "Saving…" : "Save"}
						</Button>
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

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <div className="prose dark:prose-invert max-w-none text-base md:text-lg">{faq.answer}</div>
                {isAdmin && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => editFaq(faq)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFaq(faq.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {!faqs.length && (
          <p className="text-center text-gray-500">No FAQs yet.</p>
        )}
			</div>
		</main>
	);
}
