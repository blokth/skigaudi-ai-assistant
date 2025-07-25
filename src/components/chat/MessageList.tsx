"use client";
import { Paperclip } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatMsg } from "./types";

export default function MessageList({ msgs }: { msgs: ChatMsg[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {msgs.map((m) => (
        <div
          key={m.id}
          className={cn(
            "max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words",
            m.author === "user"
              ? "ml-auto bg-primary text-primary-foreground"
              : "mr-auto bg-secondary text-secondary-foreground",
            m.loading && "italic text-muted-foreground"
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
      ))}
      <div ref={endRef} />
    </div>
  );
}
