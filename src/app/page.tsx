"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/firebase/client";
import { PartyPopper, Users, Music2, CableCar } from "lucide-react";

export default function Landing() {
	const router = useRouter();

	const anonLogin = async () => {
		await signInAnonymously(auth);
		router.push("/faq");
	};

	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-200 via-violet-200 to-fuchsia-200 text-gray-900">
			{/* ADMIN – top-right */}
			<Button
				asChild
				variant="secondary"
				size="sm"
				className="absolute top-6 right-6 md:top-8 md:right-8"
			>
				<Link href="/login">Admin&nbsp;login</Link>
			</Button>
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

				{/* WELCOME BUTTON */}
				<Button
					onClick={anonLogin}
					size="lg"
					className="px-10 py-4 shadow-lg"
				>
					Welcome
				</Button>
			</div>
		</main>
	);
}
