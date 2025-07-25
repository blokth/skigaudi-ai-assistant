"use client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function ToggleButton({ onClick }: { onClick(): void }) {
  return (
    <Button
      variant="default"
      size="icon"
      onClick={onClick}
      className="fixed right-6 z-50 w-12 h-12 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );
}
