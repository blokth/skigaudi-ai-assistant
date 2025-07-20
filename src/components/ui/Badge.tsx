import tv from "@/lib/tv";
export const badge = tv({
	base: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
	variants: {
		variant: {
			sky: "bg-festival-sky/15 text-festival-sky",
			fuchsia: "bg-festival-fuchsia/15 text-festival-fuchsia",
		},
	},
	defaultVariants: { variant: "sky" },
});
export function Badge({ variant, className = "", ...p }: any) {
	return <span className={`${badge({ variant })} ${className}`} {...p} />;
}
