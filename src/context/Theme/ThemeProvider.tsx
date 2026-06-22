import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import { ThemeContext } from "./theme.context";
import type { Theme } from "./theme.types";

type ThemeProviderProps = {
	children: ReactNode;
};

const THEME_STORAGE_KEY = "thcm-theme";

const getInitialTheme = (): Theme => {
	if (typeof window === "undefined") {
		return "light";
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setThemeState] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		const root = document.documentElement;

		root.dataset.theme = theme;
		root.style.colorScheme = theme;

		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	}, [theme]);

	const setTheme = useCallback((nextTheme: Theme) => {
		setThemeState(nextTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeState((currentTheme) =>
			currentTheme === "light" ? "dark" : "light",
		);
	}, []);

	const value = useMemo(
		() => ({
			theme,
			isDark: theme === "dark",
			setTheme,
			toggleTheme,
		}),
		[theme, setTheme, toggleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};
