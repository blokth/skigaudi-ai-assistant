"use client";

import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/firebase/client";
import {
  PartyPopper,
  Users,
  Music2,
  CableCar,
} from "lucide-react";

export default function Landing() {
  const router = useRouter();

  const anonLogin = async () => {
    await signInAnonymously(auth);
    router.push("/"); // TODO: route to main app
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-200 via-violet-200 to-fuchsia-200 text-gray-900">
      {/* halftone dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,.35) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* subtle animated blobs */}
      <div className="absolute -left-44 -top-32 w-[36rem] h-[36rem] bg-fuchsia-300/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -right-52 -bottom-40 w-[36rem] h-[36rem] bg-sky-300/20 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col items-center gap-14 px-6">
        {/* HERO */}
        <header className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight">
            <span className="text-yellow-300">Ski</span>Gaudi
          </h1>
          <p className="max-w-xl mx-auto text-lg md:text-xl font-medium">
            The Student&nbsp;Winter&nbsp;Festival · 4 days skiing, 5 stages,
            endless memories.
          </p>
        </header>

        {/* HIGHLIGHTS */}
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm md:text-base font-medium">
          <li className="flex flex-col items-center gap-1">
            <CableCar className="w-6 h-6" />
            4&nbsp;Days Skiing
          </li>
          <li className="flex flex-col items-center gap-1">
            <Music2 className="w-6 h-6" />
            5&nbsp;Stages
          </li>
          <li className="flex flex-col items-center gap-1">
            <PartyPopper className="w-6 h-6" />
            100 % Good Vibes
          </li>
          <li className="flex flex-col items-center gap-1">
            <Users className="w-6 h-6" />
            For Students
          </li>
        </ul>

        {/* AUTH CARD */}
        <section className="backdrop-blur-lg bg-white/70 dark:bg-black/70 rounded-xl p-8 w-full max-w-sm shadow-xl space-y-6 text-gray-900 dark:text-white">
          <button
            onClick={anonLogin}
            className="w-full py-3 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition"
          >
            Join anonymously
          </button>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
            <span className="flex-1 h-px bg-white/30" />
            or
            <span className="flex-1 h-px bg-white/30" />
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 rounded-lg border border-gray-800 dark:border-white text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition font-semibold"
          >
            Admin login
          </button>
        </section>
      </div>
    </main>
  );
}
