import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

	theme: {
		extend: {
			colors: {
				primary: "#f35a00",

				text: "#000000",
				muted: "#6b7280",

				border: "#d1d5db",

				danger: "#dc2626",
				success: "#16a34a",
				warning: "#f59e0b",
				info: "#0ea5e9",
			},
		},
	},

	plugins: [],
};

export default config;
