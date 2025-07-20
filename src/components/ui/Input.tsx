import tv from "@/lib/tv";
export const inputStyle = tv({
	base: "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-festival-sky",
});
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input {...props} className={inputStyle({ class: props.className })} />
	);
}
