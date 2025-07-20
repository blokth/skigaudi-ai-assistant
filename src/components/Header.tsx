"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/firebase/client";

export default function Header() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center pointer-events-none py-4">
      {/* island */}
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-10",
          "bg-white/90 dark:bg-gray-900/80 backdrop-blur-md",
          "border border-gray-200 dark:border-gray-700 shadow-lg",
          "rounded-full px-8 py-3",
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
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full"
                aria-label="Admin menu"
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
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/skibot">Configure&nbsp;SkiBot</Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onSelect={async (e) => {
                  e.preventDefault();
                  await signOut(auth);
                  router.replace("/");
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full"
            aria-label="Login"
          >
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
