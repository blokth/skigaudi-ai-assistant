"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput
} from "@chatscope/chat-ui-kit-react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMsg = { author: "user" | "ai"; text: string };

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMsgs]   = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setMsgs(p => [...p, { author: "user", text }]);
    setSending(true);
    try {
      const call = httpsCallable(functions, "faqChat");
      const { data } = await call(text);
      setMsgs(p => [...p, { author: "ai", text: data as string }]);
    } catch {
      setMsgs(p => [...p, { author: "ai", text: "Something went wrong." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* floating toggle button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-sky-600 hover:bg-sky-500 transition
                   text-white flex items-center justify-center
                   shadow-lg ring-2 ring-white/60 ring-offset-2 ring-offset-sky-600"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 w-72 md:w-96 h-[32rem]",
            "rounded-2xl overflow-hidden shadow-xl",
            "bg-white/70 dark:bg-gray-900/60 backdrop-blur-md",
            "border border-gray-200 dark:border-gray-700"
          )}
        >
          <MainContainer responsive style={{ backgroundColor: "transparent" }}>
            <ChatContainer style={{ backgroundColor: "transparent" }}>
              <MessageList style={{ backgroundColor: "transparent", padding: "0.75rem" }}>
                {messages.map((m, i) => (
                  <Message
                    key={i}
                    model={{
                      message: m.text,
                      direction: m.author === "user" ? "outgoing" : "incoming"
                    }}
                    style={{ boxShadow: "none", background: "var(--cs-color-bg-base)" }}
                  />
                ))}
              </MessageList>
              <MessageInput
                placeholder="Ask a question…"
                attachButton={false}
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
        </div>
      )}
    </>
  );
}
