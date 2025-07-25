"use client";
import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  disabled: boolean;
  isAdmin: boolean;
  onSend(text: string): void;
  onAttachClick(): void;
};
export default function InputRow({ disabled, isAdmin, onSend, onAttachClick }: Props) {
  const [input, setInput] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input);
        setInput("");
      }}
      className="border-t border-border flex items-center gap-2 p-3"
    >
      {isAdmin && (
        <Button type="button" variant="ghost" size="icon" onClick={onAttachClick} disabled={disabled}>
          <Paperclip className="size-4" />
        </Button>
      )}

      <input
        type="text"
        placeholder="Ask a question…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
      />

      <Button type="submit" size="icon" variant="ghost" disabled={disabled || !input.trim()}>
        <Send className="size-4" />
      </Button>
    </form>
  );
}
