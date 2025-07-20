import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Header() {
	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm"
			)}
		>
			<div className="container flex items-center justify-center gap-6 py-4">
				<Link href="/" className="font-semibold text-base tracking-tight">
					SkiGaudi
				</Link>
				<nav className="flex items-center gap-4 text-sm font-medium">
					<Link href="/">Home</Link>
					<Link href="/faq">FAQ</Link>
					<Link href="/login" className="hover:underline">
						Admin&nbsp;login
					</Link>
					{/* <Link href="/tickets">Tickets</Link> */}
				</nav>
			</div>
		</header>
	);
}
