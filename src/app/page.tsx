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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-600 text-white">
      {/* subtle animated blobs */}
      <div className="absolute -left-44 -top-32 w-[36rem] h-[36rem] bg-fuchsia-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -right-52 -bottom-40 w-[36rem] h-[36rem] bg-sky-400/30 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col items-center gap-14 px-6">
        {/* HERO */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
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
        <section className="backdrop-blur-md bg-white/10 rounded-xl p-8 w-full max-w-sm shadow-lg space-y-6">
          <button
            onClick={anonLogin}
            className="w-full py-3 rounded-lg bg-yellow-300 text-black font-semibold hover:opacity-90 transition"
          >
            Join anonymously
          </button>

          <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-wide">
            <span className="flex-1 h-px bg-white/30" />
            or
            <span className="flex-1 h-px bg-white/30" />
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 rounded-lg border border-white/40 hover:bg-white/10 transition font-semibold"
          >
            Admin login
          </button>
        </section>
      </div>
    </main>
  );
}
