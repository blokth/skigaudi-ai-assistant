export function Card({
	className = "",
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`rounded-xl bg-white/70 dark:bg-gray-800/60 backdrop-blur ring-1 ring-gray-200 dark:ring-gray-700 ${className}`}
			{...props}
		/>
	);
}
