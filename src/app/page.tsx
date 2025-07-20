"use client";

import confetti from "canvas-confetti";
import { signInAnonymously } from "firebase/auth";
import { CableCar, Music2, PartyPopper, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase/client";

export default function Landing() {
	const router = useRouter();

	const videoUrl =
		"https://firebasestorage.googleapis.com/v0/b/skigaudi-ai-assistant.firebasestorage.app/o/skiing.mp4?alt=media";

	const anonLogin = async (e: React.MouseEvent) => {
		confetti({
			particleCount: 120,
			spread: 90,
			origin: {
				x: e.clientX / window.innerWidth,
				y: e.clientY / window.innerHeight,
			},
		});

		await signInAnonymously(auth);
		router.push("/faq");
	};

	return (
		<main className="relative overflow-hidden min-h-screen flex justify-center items-start pt-16 text-white px-4">
			<div
				className="relative flex flex-col items-center justify-center gap-14 px-6
                   w-[95vw] max-w-6xl h-[75vh]
                   overflow-hidden rounded-2xl"
			>
				{/* background video (optimized) */}
				<video
					className="absolute inset-0 w-full h-full object-cover brightness-50 -z-10 pointer-events-none"
					autoPlay
					loop
					muted
					playsInline
					preload="metadata"          {/* don’t download full file up-front */}
					aria-hidden="true"          {/* purely decorative */}
				>
					<source src={videoUrl} type="video/mp4" />
					Your browser does not support the video tag.
				</video>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-black/30 -z-10"
				/>

				{/* HERO */}
				<header className="text-center space-y-4">
					<h1 className="text-5xl md:text-7xl text-amber-400 font-extrabold tracking-tight">
						SkiGaudi
					</h1>
					<p className="max-w-xl mx-auto text-lg md:text-xl font-medium">
						The Student&nbsp;Winter&nbsp;Festival · 4 days skiing, 5 stages,
						endless memories.
					</p>
				</header>

				{/* HIGHLIGHTS */}
				<ul className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs md:text-sm font-medium">
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
					className="px-12 py-5 rounded-full text-lg font-semibold text-gray-900
                     bg-amber-400 hover:bg-amber-300
                     shadow-lg shadow-amber-500/20
                     transition-transform duration-200 hover:scale-105 active:scale-95
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
				>
					Welcome
				</Button>
			</div>
		</main>
	);
}
