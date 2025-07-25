export type ChatMsg = {
  id: string;
  author: "user" | "ai";
  text?: string;
  attachmentName?: string;
  loading?: boolean;   // true while the AI response is still generating
};
