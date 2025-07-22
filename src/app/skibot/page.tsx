"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytes, listAll, deleteObject } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase/client";

export default function SkiBotConfig() {
  const { isAdmin, loading } = useAuth();

  /* ── system prompt ── */
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState<string[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);

  // initial data fetch – prompt & file list in one go
  useEffect(() => {
    (async () => {
      const [promptSnap, list] = await Promise.all([
        getDoc(doc(db, "systemPrompts", "chatPrompt")),
        listAll(ref(storage, "knowledge")),
      ]);
      setPrompt(promptSnap.exists() ? promptSnap.data()?.content ?? "" : "");
      setFiles(list.items.map((i) => i.name));
      setFilesLoading(false);
    })();
  }, []);

  const savePrompt = async () => {
    if (!isAdmin) return;
    setSaving(true);
    await setDoc(doc(db, "systemPrompts", "chatPrompt"), {
      content: prompt,
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    alert("System prompt saved");
  };

  /* ── knowledge upload ── */
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["application/pdf", "text/plain", "text/markdown"].includes(file.type) &&
      !/\.(pdf|txt|md)$/i.test(file.name)
    ) {
      setErr("Unsupported file type.");
      return;
    }

    setUploading(true);
    setErr("");
    try {
      await uploadBytes(ref(storage, `knowledge/${file.name}`), file);
      alert("File uploaded successfully and will be processed shortly.");
      setFiles((prev) => [...prev, file.name]);   // refresh list
    } catch {
      setErr("Upload failed.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteObject(ref(storage, `knowledge/${name}`));
      setFiles((prev) => prev.filter((f) => f !== name));
    } catch (e) {
      console.error(e);
      alert("Failed to delete file – missing permissions?");
    }
  };

  if (loading)
    return <main className="min-h-screen flex items-center justify-center">Loading…</main>;
  if (!isAdmin)
    return <main className="min-h-screen flex items-center justify-center">Not authorized.</main>;

  const box = "space-y-4 p-6 bg-card/60 border rounded-xl";

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-bold text-center mt-10 mb-14">Configure SkiBot</h1>

      <div className="w-full max-w-2xl space-y-12">
        {/* prompt */}
        <section className={box}>
          <h2 className="text-2xl font-semibold">System prompt</h2>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ height: "8rem" }}
          />
          <Button variant="secondary" onClick={savePrompt} disabled={saving}>
            {saving ? "Saving…" : "Save prompt"}
          </Button>
        </section>

        {/* knowledge docs */}
        <section className={box}>
          <h2 className="text-2xl font-semibold">Upload knowledge document</h2>
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={onFile}
            disabled={uploading}
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {err && <p className="text-red-500 text-sm">{err}</p>}
          {uploading && <p className="text-sm">Uploading…</p>}

          {filesLoading ? (
            <p className="text-sm">Loading documents…</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No knowledge documents uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f} className="flex items-center justify-between">
                  <span>{f}</span>
                  <Button variant="destructive" size="sm" onClick={() => deleteFile(f)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
