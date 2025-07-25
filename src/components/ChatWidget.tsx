"use client";
import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { uploadBytes, ref as storageRef } from "firebase/storage";
import { usePathname } from "next/navigation";
import ToggleButton from "./chat/ToggleButton";
import Panel from "./chat/Panel";
import { functions, storage } from "@/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { ChatMsg } from "./chat/types";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);

  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const push = (m: ChatMsg) => setMsgs((p) => [...p, m]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      push({ id: crypto.randomUUID(), author: "user", text });

      setSending(true);
      try {
        const call = httpsCallable(functions, "chat");
        const history = [...msgs, { id: "", author: "user", text }]
          .filter((m) => m.text)
          .map((m) => ({
            role: m.author === "user" ? "user" : "model",
            content: [{ text: m.text! }],
          }));

        const stream = call.stream({ messages: history }) as AsyncIterable<string>;

        const aiMsgId = crypto.randomUUID();
        push({ id: aiMsgId, author: "ai", text: "" });

        for await (const chunk of stream) {
          setMsgs((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: (m.text ?? "") + chunk } : m,
            ),
          );
        }
      } catch {
        push({
          id: crypto.randomUUID(),
          author: "ai",
          text: "Something went wrong.",
        });
      } finally {
        setSending(false);
      }
    },
    [msgs]
  );

  const handleFile = async (file: File) => {
    push({ id: crypto.randomUUID(), author: "user", attachmentName: file.name });

    if (!/(\.pdf|\.txt|\.md)$/i.test(file.name)) {
      alert("Unsupported file type.");
      return;
    }

    try {
      await uploadBytes(storageRef(storage, `knowledge/${file.name}`), file);
      push({
        id: crypto.randomUUID(),
        author: "ai",
        text: "File uploaded successfully and will be processed shortly.",
      });
    } catch {
      push({
        id: crypto.randomUUID(),
        author: "ai",
        text: "Upload failed.",
      });
    }
  };

  if (pathname === "/login") return null;

  return (
    <>
      <ToggleButton onClick={() => setOpen((o) => !o)} />
      {open && (
        <Panel
          msgs={msgs}
          isAdmin={isAdmin}
          sending={sending}
          onSend={send}
          onFilePicked={handleFile}
        />
      )}
    </>
  );
}
