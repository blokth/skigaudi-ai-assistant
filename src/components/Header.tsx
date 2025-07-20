import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Header() {
	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md"
			)}
		>
			<div className="container flex items-center justify-between py-4">
				<Link href="/" className="font-extrabold text-lg tracking-tight">
					Ski<span className="text-yellow-300">Gaudi</span>
				</Link>
				<nav className="flex items-center gap-6 text-sm font-medium">
					<Link href="/">Home</Link>
					<Link href="/faq">FAQ</Link>
					{/* <Link href="/tickets">Tickets</Link> */}
				</nav>
			</div>
		</header>
	);
}
