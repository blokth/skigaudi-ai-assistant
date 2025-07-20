import React from "react";
import { cn } from "@/lib/utils";

export default function Footer() {
	return (
		<footer className={cn("bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 mt-24")}>
			<div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
				<p className="text-sm">&copy; {new Date().getFullYear()} SkiGaudi. All rights reserved.</p>
				<div className="flex gap-4 text-sm">
					<a href="mailto:hello@skigaudi.com" className="hover:underline">Contact</a>
					<a href="#" className="hover:underline">Imprint</a>
					<a href="#" className="hover:underline">Privacy</a>
				</div>
			</div>
		</footer>
	);
}
