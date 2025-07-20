import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
	content: ["src/**/*.{ts,tsx}"],
	theme: {
		fontSize: {
			xs: ["0.875rem", "1.4"],
			sm: ["1rem", "1.5"],
			base: ["1.125rem", "1.6"],
			lg: ["1.25rem", "1.6"],
			xl: ["1.5rem", "1.4"],
			"2xl": ["2rem", "1.2"],
			"3xl": ["3rem", "1.1"],
		},
		container: { center: true, padding: "1rem" },
		extend: {
			colors: {
				festival: {
					yellow: "#fde047", // yellow-400
					fuchsia: "#f0abfc",
					sky: "#38bdf8",
					slate: "#0f172a",
				},
			},
		},
	},
	plugins: [animate, typography],
} satisfies Config;
