import { cn } from "@/lib/utils";

export default function Footer() {
	return (
		<footer className="flex justify-center pointer-events-none mt-24 mb-6">
			<div
				className={cn(
					"pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-4",
					"bg-white/90 dark:bg-gray-900/80 backdrop-blur-md",
					"border border-gray-200 dark:border-gray-700 shadow-lg",
					"rounded-full px-6 sm:px-8 py-5 w-full max-w-5xl",
				)}
			>
				<p className="text-sm">
					&copy; {new Date().getFullYear()} SkiGaudi. All rights reserved.
				</p>
				<div className="flex gap-4 text-sm">
					<a href="mailto:hello@skigaudi.com" className="hover:underline">
						Contact
					</a>
					<a href="/imprint" className="hover:underline">
						Imprint
					</a>
					<a href="/privacy" className="hover:underline">
						Privacy
					</a>
				</div>
			</div>
		</footer>
	);
}
