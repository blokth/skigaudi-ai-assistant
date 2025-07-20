"use client";

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
		<main className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">

			<div className="relative z-10 flex flex-col items-center gap-14 px-6">
				{/* HERO */}
				<header className="text-center space-y-4">
					<h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
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
					className="px-10 py-4 shadow-lg"
				>
					Welcome
				</Button>
			</div>
		</main>
	);
}
