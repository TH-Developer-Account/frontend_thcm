export type Theme = "light" | "dark";

export type ThemeContextValue = {
	theme: Theme;
	isDark: boolean;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
};
