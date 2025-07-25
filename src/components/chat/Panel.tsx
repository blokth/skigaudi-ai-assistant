"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import MessageList from "./MessageList";
import InputRow from "./InputRow";
import { ChatMsg } from "./types";

type Props = {
  msgs: ChatMsg[];
  isAdmin: boolean;
  sending: boolean;
  onSend(text: string): void;
  onFilePicked(file: File): void;
};
export default function Panel({ msgs, isAdmin, sending, onSend, onFilePicked }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
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
        <MessageList msgs={msgs} />
        <InputRow
          disabled={sending}
          isAdmin={isAdmin}
          onSend={onSend}
          onAttachClick={() => fileRef.current?.click()}
        />
      </div>

      {/* hidden file picker */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFilePicked(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
