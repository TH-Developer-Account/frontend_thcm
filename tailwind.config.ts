import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

	theme: {
		extend: {
			colors: {
				/* ============================================
				   Brand
				============================================ */
				brand: {
					DEFAULT: "var(--color-brand)",
					hover: "var(--color-brand-hover)",
					active: "var(--color-brand-active)",
					soft: "var(--color-brand-soft)",
					subtle: "var(--color-brand-subtle)",
					foreground: "var(--color-brand-foreground)",

					50: "var(--color-orange-50)",
					100: "var(--color-orange-100)",
					200: "var(--color-orange-200)",
					300: "var(--color-orange-300)",
					400: "var(--color-orange-400)",
					500: "var(--color-orange-500)",
					600: "var(--color-orange-600)",
					700: "var(--color-orange-700)",
					800: "var(--color-orange-800)",
					900: "var(--color-orange-900)",
				},

				/* ============================================
				   Brand neutrals
				============================================ */
				"machine-black": "var(--color-machine-black)",
				"clean-white": "var(--color-clean-white)",
				fog: "var(--color-fog)",
				ash: "var(--color-ash)",
				slate: "var(--color-slate)",
				"steel-blue": "var(--color-steel-blue)",
				iron: "var(--color-iron)",
				"iron-dark": "var(--color-iron-dark)",

				/* ============================================
				   Neutral scale
				============================================ */
				neutral: {
					0: "var(--color-neutral-0)",
					50: "var(--color-neutral-50)",
					100: "var(--color-neutral-100)",
					200: "var(--color-neutral-200)",
					300: "var(--color-neutral-300)",
					400: "var(--color-neutral-400)",
					500: "var(--color-neutral-500)",
					600: "var(--color-neutral-600)",
					700: "var(--color-neutral-700)",
					800: "var(--color-neutral-800)",
					900: "var(--color-neutral-900)",
					950: "var(--color-neutral-950)",
				},

				/* ============================================
				   Semantic backgrounds
				============================================ */
				surface: {
					DEFAULT: "var(--color-bg-surface)",
					subtle: "var(--color-bg-surface-subtle)",
					muted: "var(--color-bg-surface-muted)",
					hover: "var(--color-bg-surface-hover)",
					active: "var(--color-bg-surface-active)",
					disabled: "var(--color-bg-disabled)",
					dark: "var(--color-bg-dark)",
					darker: "var(--color-bg-darker)",
				},

				page: "var(--color-bg-page)",
				overlay: "var(--color-bg-overlay)",

				/* ============================================
				   Semantic text
				============================================ */
				content: {
					DEFAULT: "var(--color-text-primary)",
					secondary: "var(--color-text-secondary)",
					muted: "var(--color-text-muted)",
					subtle: "var(--color-text-subtle)",
					disabled: "var(--color-text-disabled)",
					inverse: "var(--color-text-inverse)",
					brand: "var(--color-text-brand)",
				},

				/* ============================================
				   Borders
				============================================ */
				border: {
					DEFAULT: "var(--color-border-default)",
					subtle: "var(--color-border-subtle)",
					strong: "var(--color-border-strong)",
					hover: "var(--color-border-hover)",
					brand: "var(--color-border-brand)",
					disabled: "var(--color-border-disabled)",
					dark: "var(--color-border-dark)",
				},

				/* ============================================
				   Icons
				============================================ */
				icon: {
					DEFAULT: "var(--color-icon-primary)",
					secondary: "var(--color-icon-secondary)",
					muted: "var(--color-icon-muted)",
					disabled: "var(--color-icon-disabled)",
					brand: "var(--color-icon-brand)",
					inverse: "var(--color-icon-inverse)",
				},

				/* ============================================
				   Feedback
				============================================ */
				success: {
					DEFAULT: "var(--color-success)",
					hover: "var(--color-success-hover)",
					bg: "var(--color-success-bg)",
					border: "var(--color-success-border)",
				},

				warning: {
					DEFAULT: "var(--color-warning)",
					hover: "var(--color-warning-hover)",
					bg: "var(--color-warning-bg)",
					border: "var(--color-warning-border)",
				},

				error: {
					DEFAULT: "var(--color-error)",
					hover: "var(--color-error-hover)",
					bg: "var(--color-error-bg)",
					border: "var(--color-error-border)",
				},

				info: {
					DEFAULT: "var(--color-info)",
					hover: "var(--color-info-hover)",
					bg: "var(--color-info-bg)",
					border: "var(--color-info-border)",
				},

				/* ============================================
				   Status badges
				============================================ */
				status: {
					approved: {
						text: "var(--color-status-approved-text)",
						bg: "var(--color-status-approved-bg)",
						border: "var(--color-status-approved-border)",
					},
					pending: {
						text: "var(--color-status-pending-text)",
						bg: "var(--color-status-pending-bg)",
						border: "var(--color-status-pending-border)",
					},
					rejected: {
						text: "var(--color-status-rejected-text)",
						bg: "var(--color-status-rejected-bg)",
						border: "var(--color-status-rejected-border)",
					},
					draft: {
						text: "var(--color-status-draft-text)",
						bg: "var(--color-status-draft-bg)",
						border: "var(--color-status-draft-border)",
					},
					inactive: {
						text: "var(--color-status-inactive-text)",
						bg: "var(--color-status-inactive-bg)",
						border: "var(--color-status-inactive-border)",
					},
					info: {
						text: "var(--color-status-info-text)",
						bg: "var(--color-status-info-bg)",
						border: "var(--color-status-info-border)",
					},
				},
			},

			ringColor: {
				brand: "var(--color-focus-ring)",
				error: "var(--color-error)",
				success: "var(--color-success)",
			},

			outlineColor: {
				brand: "var(--color-focus-ring)",
			},
		},
	},

	plugins: [],
};

export default config;
