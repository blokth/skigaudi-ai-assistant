import { z } from "genkit";
import { ai } from "../core";
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";
import { chunk } from "llm-chunk";
import { readFile } from "fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";

/* ─ indexer & chunking config ─ */
const knowledgeIndexer = devLocalIndexerRef("knowledge");
const chunkingConfig = {
  minLength: 1000,
  maxLength: 2000,
  overlap: 100,
  splitter: "sentence",
  delimiters: "",
} as any;

/* helper: extract text from a PDF on disk */
async function extractTextFromPdf(filePath: string) {
  const buf = await readFile(path.resolve(filePath));
  const pdf = await pdfParse(buf);
  return pdf.text;
}

/* flow: index one local PDF/txt/md file */
export const indexKnowledge = ai.defineFlow(
  {
    name: "indexKnowledge",
    inputSchema: z.object({ filePath: z.string().describe("PDF/TXT/MD file path") }),
    outputSchema: z.object({
      success: z.boolean(),
      documentsIndexed: z.number(),
      error: z.string().optional(),
    }),
  },
  /* eslint-disable-next-line consistent-return */
  async ({ filePath }) => {
    try {
      filePath = path.resolve(filePath);
      const text =
        filePath.toLowerCase().endsWith(".pdf")
          ? await ai.run("extract-text", () => extractTextFromPdf(filePath))
          : await readFile(filePath, "utf8");

      const chunks = await ai.run("chunk", () => chunk(text, chunkingConfig));
      const documents = chunks.map((c) => Document.fromText(c, { filePath }));

      await ai.index({ indexer: knowledgeIndexer, documents });

      return { success: true, documentsIndexed: documents.length };
    } catch (e) {
      return {
        success: false,
        documentsIndexed: 0,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
);
