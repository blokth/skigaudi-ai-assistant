import tv from "@/lib/tv";
export const textareaStyle = tv({
	base: "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-festival-sky",
});
export function Textarea(
	props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
	return (
		<textarea
			{...props}
			className={textareaStyle({ class: props.className })}
		/>
	);
}
