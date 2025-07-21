import { z } from "genkit";
import { ai } from "../core";                     // ← fixed
import { devLocalIndexerRef } from "@genkit-ai/dev-local-vectorstore";
import { Document } from "genkit/retriever";
import { chunk } from "llm-chunk";
import { readFile } from "fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";
import { defineFlow, run } from "genkit/flow";

/* --- Configuration -------------------------------------------------- */
const KNOWLEDGE_INDEXER_REF = devLocalIndexerRef("knowledge");
const CHUNKING_CONFIG = {
  minLength: 1000,
  maxLength: 2000,
  overlap: 100,
  splitter: "sentence" as const,
  delimiters: "",
};

/* --- Helper functions ----------------------------------------------- */
async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function loadText(filePath: string): Promise<string> {
  const resolvedPath = path.resolve(filePath);
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === ".pdf") {
    return run("extract-pdf-text", () => extractTextFromPdf(resolvedPath));
  }
  if (ext === ".txt" || ext === ".md") {
    return readFile(resolvedPath, "utf8");
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

/* --- Main flow ------------------------------------------------------- */
export const indexKnowledge = defineFlow(
  {
    name: "indexKnowledge",
    inputSchema: z.object({
      filePath: z.string().describe("Path to the PDF, TXT, or MD file"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      documentsIndexed: z.number(),
      error: z.string().optional(),
    }),
  },
  async ({ filePath }) => {
    try {
      const text = await loadText(filePath);
      const chunks = await run("chunk-document-text", () =>
        chunk(text, CHUNKING_CONFIG),
      );

      const documents = chunks.map((c) =>
        Document.fromText(c, { filePath }),
      );

      await ai.index({ indexer: KNOWLEDGE_INDEXER_REF, documents });

      console.log(
        `Successfully indexed ${documents.length} documents from ${filePath}`,
      );
      return { success: true, documentsIndexed: documents.length };
    } catch (e: any) {
      console.error(`Failed to index ${filePath}:`, e);
      return {
        success: false,
        documentsIndexed: 0,
        error: e.message || String(e),
      };
    }
  },
);
