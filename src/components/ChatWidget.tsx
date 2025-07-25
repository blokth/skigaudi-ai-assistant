"use client";

import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { MessageCircle, Paperclip, Send } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { functions, storage } from "@/firebase/client";
import { cn } from "@/lib/utils";


type ChatMsg = {
  id: string;
  author: "user" | "ai";
  text?: string;              // normal text message
  attachmentName?: string;    // when an uploaded file should be shown
  loading?: boolean;          // marks interim “thinking” entry
};

// small helper to append a message
const append =
  (set: React.Dispatch<React.SetStateAction<ChatMsg[]>>) =>
    (msg: ChatMsg) =>
      set((prev) => [...prev, msg]);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMsgs] = useState<ChatMsg[]>([]);
  const push = append(setMsgs);
  const [sending, setSending] = useState(false);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { isAdmin } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    push({ id: crypto.randomUUID(), author: "user", attachmentName: file.name });

    if (!/(\.pdf|\.txt|\.md)$/i.test(file.name)) {
      alert("Unsupported file type.");          // early exit, don’t clear value to allow re-pick
      return;
    }

    try {
      await uploadBytes(ref(storage, `knowledge/${file.name}`), file);
      push({ id: crypto.randomUUID(), author: "ai", text: "File uploaded successfully and will be processed shortly." });
    } catch {
      push({ id: crypto.randomUUID(), author: "ai", text: "Upload failed." });
    } finally {
      e.target.value = "";
    }
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // user message
      push({ id: crypto.randomUUID(), author: "user", text });

      setSending(true);
      try {
        const call = httpsCallable(functions, "chat");
        const { stream } = call;                       // ← grab the stream factory
        const history = [...messages, { id: "", author: "user", text }]
          .filter((m) => m.text)
          .map((m) => ({
            role: m.author === "user" ? "user" : "model",
            content: [{ text: m.text! }],
          }));

        const iterable = await stream({ messages: history });  // AsyncIterable<StreamData>

        // create empty AI bubble that we will extend chunk-by-chunk
        const aiMsgId = crypto.randomUUID();
        push({ id: aiMsgId, author: "ai", text: "" });

        for await (const chunk of iterable as AsyncIterable<string>) {
          setMsgs((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: (m.text ?? "") + chunk } : m,
            ),
          );
        }
      } catch {
        push({ id: crypto.randomUUID(),
               author: "ai",
               text: "Something went wrong." });
      } finally {
        setSending(false);
      }
    },
    [messages, push],
  );

  // hide widget & toggle button on /login
  if (pathname === "/login") return null;

  return (
    <>
      {/* floating toggle button */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setOpen((p) => !p)}
        className="fixed right-6 z-50 w-12 h-12 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
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
            "bg-white/90 dark:bg-gray-900/80 backdrop-blur-md",
            "border border-border",
          )}
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
        >
          <div className="flex flex-col h-full">
            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) =>
                m.loading ? (
                  <div
                    key={m.id}
                    className="mx-auto text-xs italic text-muted-foreground"
                  >
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words",
                      m.author === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "mr-auto bg-secondary text-secondary-foreground",
                    )}
                  >
                    {m.attachmentName ? (
                      <div className="inline-flex items-center gap-2">
                        <Paperclip className="size-4 shrink-0" />
                        <span className="break-all">{m.attachmentName}</span>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                ),
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) return;
                handleSend(input);
                setInput("");
              }}
              className="border-t border-border flex items-center gap-2 p-3"
            >
              {isAdmin && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleAttachClick}
                  disabled={sending}
                >
                  <Paperclip className="size-4" />
                </Button>
              )}

              <input
                type="text"
                placeholder="Ask a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              />

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={sending || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>

          {/* hidden file picker */}
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
