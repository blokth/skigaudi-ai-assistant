"use client";

import { auth } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  const handleAnonymous = async () => {
    await signInAnonymously(auth);
    router.push("/");              // stay on site (or go to /chat later)
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-14 p-8">
      <h1 className="text-4xl tracking-tight font-sans font-semibold">
        SkiGaudi · Winter Festival
      </h1>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xs">
        <button
          onClick={handleAnonymous}
          className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black py-3 text-center hover:opacity-90 transition"
        >
          Anonymer&nbsp;Login
        </button>

        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-md border border-black dark:border-white py-3 text-center hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Admin&nbsp;Login
        </button>
      </div>
    </main>
  );
}
