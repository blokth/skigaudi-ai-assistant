export type ChatMsg = {
  id: string;
  author: "user" | "ai";
  text?: string;
  attachmentName?: string;
};
