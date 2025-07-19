"use client";

import { useState } from "react";
import { auth } from "@/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      router.replace("/faq");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Admin Login</h2>

        <input
          type="email"
          required
          placeholder="E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded border px-3 py-2 bg-transparent"
        />
        <input
          type="password"
          required
          placeholder="Passwort"
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="rounded border px-3 py-2 bg-transparent"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-black text-white dark:bg-white dark:text-black py-2 hover:opacity-90 transition"
        >
          Login
        </button>
      </form>
    </main>
  );
}
