"use client";

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/client";

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

	const sectionClass = "space-y-4 p-6 bg-card/60 border rounded-xl";

	useEffect(() => {
		const unsub = onSnapshot(collection(db, "faqs"), (snap) => {
			setFaqs(
				snap.docs.map((d) => ({
					id: d.id,
					...(d.data() as Omit<FAQ, "id">),
				})),
			);
			setLoading(false);
		});

		return () => unsub();
	}, []);

	const createFaq = async () => {
		if (!question.trim() || !answer.trim()) return;
		setSaving(true);
		await addDoc(collection(db, "faqs"), { question, answer });
		setQuestion("");
		setAnswer("");
		setSaving(false);
	};

	const editFaq = async (faq: FAQ) => {
		const q = prompt("Question:", faq.question);
		if (q == null) return;
		const a = prompt("Answer:", faq.answer);
		if (a == null) return;
		setSaving(true);
		await updateDoc(doc(db, "faqs", faq.id), { question: q, answer: a });
		setSaving(false);
	};

	const removeFaq = async (id: string) => {
		if (!confirm("Delete this FAQ?")) return;
		setSaving(true);
		await deleteDoc(doc(db, "faqs", id));
		setSaving(false);
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

				<Accordion type="multiple" className="space-y-4">
					{faqs.map((faq) => (
						<AccordionItem key={faq.id} value={faq.id}>
							<AccordionTrigger>{faq.question}</AccordionTrigger>
							<AccordionContent>
								<div className="prose dark:prose-invert max-w-none text-base md:text-lg">
									{faq.answer}
								</div>
								{isAdmin && (
									<div className="flex gap-2 mt-4">
										<Button
											size="sm"
											variant="outline"
											onClick={() => editFaq(faq)}
										>
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
