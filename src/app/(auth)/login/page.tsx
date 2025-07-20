"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/firebase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "An unexpected error occurred";
			setError(message);
		}
	};

	return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-center">Admin Login</h2>

        <Input
          type="email"
          required
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" className="w-full" onClick={submit}>
          Login
        </Button>
      </Card>
    </main>
  );
}
