"use client";

import {
	ChatContainer,
	MainContainer,
	Message,
	MessageInput,
	MessageList,
} from "@chatscope/chat-ui-kit-react";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { functions, storage } from "@/firebase/client";
import { cn } from "@/lib/utils";

type ChatMsg = { id: string; author: "user" | "ai"; text: string };

export default function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMsgs] = useState<ChatMsg[]>([]);
	const [sending, setSending] = useState(false);

	const { isAdmin } = useAuth();

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAttachClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// accept only PDF, TXT or MD
		if (
			!["application/pdf", "text/plain", "text/markdown"].includes(file.type) &&
			!/\.(pdf|txt|md)$/i.test(file.name)
		) {
			alert("Unsupported file type.");
			return;
		}

		try {
			const storageRef = ref(storage, `knowledge/${file.name}`);
			await uploadBytes(storageRef, file);
			setMsgs((p) => [
				...p,
				{
					id: crypto.randomUUID(),
					author: "ai",
					text: "File uploaded successfully and will be processed shortly.",
				},
			]);
		} catch {
			setMsgs((p) => [
				...p,
				{ id: crypto.randomUUID(), author: "ai", text: "Upload failed." },
			]);
		} finally {
			if (e.target) e.target.value = "";
		}
	};

	const handleSend = async (text: string) => {
		if (!text.trim()) return;
		setMsgs((p) => [...p, { id: crypto.randomUUID(), author: "user", text }]);
		setSending(true);
		try {
			const call = httpsCallable(functions, "faqChat");
			const { data } = await call(text);
			setMsgs((p) => [
				...p,
				{ id: crypto.randomUUID(), author: "ai", text: data as string },
			]);
		} catch {
			setMsgs((p) => [
				...p,
				{ id: crypto.randomUUID(), author: "ai", text: "Something went wrong." },
			]);
		} finally {
			setSending(false);
		}
	};

	return (
		<>
			{/* floating toggle button */}
			<Button
				variant="secondary"
				size="icon"
				onClick={() => setOpen((p) => !p)}
				className="fixed right-6 rounded-full shadow-lg ring-2 ring-white/60 ring-offset-2 ring-offset-sky-600 z-50 w-14 h-14 flex items-center justify-center"
				style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
			>
				<MessageCircle className="w-6 h-6" />
			</Button>

			{/* chat panel */}
			{open && (
				<div
					className={cn(
						"fixed right-6 z-50 w-72 md:w-96 h-[32rem]",
						"rounded-2xl overflow-hidden shadow-xl",
						"bg-white/70 dark:bg-gray-900/60 backdrop-blur-md",
						"border border-gray-200 dark:border-gray-700",
					)}
					style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
				>
					<MainContainer responsive style={{ backgroundColor: "transparent" }}>
						<ChatContainer style={{ backgroundColor: "transparent" }}>
							<MessageList
								style={{ backgroundColor: "transparent", padding: "0.75rem" }}
							>
								{messages.map((m) => (
									<Message
										key={m.id}
										model={{
											position: "normal",
											message: m.text,
											direction: m.author === "user" ? "outgoing" : "incoming",
										}}
										style={{
											boxShadow: "none",
											background: "var(--cs-color-bg-base)",
										}}
									/>
								))}
							</MessageList>
							<MessageInput
								placeholder="Ask a question…"
								attachButton={isAdmin}
								onAttachClick={isAdmin ? handleAttachClick : undefined}
								disabled={sending}
								onSend={handleSend}
								style={{
									background: "transparent",
									borderTop: "1px solid var(--cs-color-border)",
									padding: "0.75rem",
								}}
							/>
						</ChatContainer>
					</MainContainer>
					<input
						type="file"
						accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
						ref={fileInputRef}
						onChange={handleFileSelect}
						style={{ display: "none" }}
					/>
				</div>
			)}
		</>
	);
}
