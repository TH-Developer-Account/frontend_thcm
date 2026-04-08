import type { Config } from "tailwindcss";
const config: Config = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

	theme: {
		extend: {
			colors: {
				brand: "var(--color-brand)",
				"brand-hover": "var(--color-brand-hover)",
				"brand-soft": "var(--color-brand-soft)",
				"brand-softest": "var(--color-brand-softest)",
			},
		},
	},

	plugins: [],
};

export default config;
