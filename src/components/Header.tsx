"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, isAdmin } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center pointer-events-none py-4">
      {/* island */}
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-8",
          "bg-white/90 dark:bg-gray-900/80 backdrop-blur-md",
          "border border-gray-200 dark:border-gray-700 shadow-lg",
          "rounded-full px-6 py-2",
        )}
      >
        {/* Brand */}
        <Link
          href="/"
          className="font-semibold text-base tracking-tight hover:opacity-80"
        >
          SkiGaudi
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/faq">FAQ</Link>
          <Link href="/tickets">Tickets</Link>
        </nav>

        {/* Account / admin login */}
        <Link
          href={isAdmin ? "/faq" : "/login"}
          className="hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full"
          aria-label={isAdmin ? "Admin" : "Login"}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </Link>
      </div>
    </header>
  );
}
