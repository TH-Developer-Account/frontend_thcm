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

const getSystemTheme = (): Theme => {
	if (typeof window === "undefined") {
		return "light";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

const getStoredTheme = (): Theme | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	return null;
};

const getInitialTheme = (): Theme => {
	return getStoredTheme() ?? getSystemTheme();
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setThemeState] = useState<Theme>(getInitialTheme);
	const [isSystemTheme, setIsSystemTheme] = useState(() => !getStoredTheme());

	useEffect(() => {
		const root = document.documentElement;

		root.dataset.theme = theme;
		root.style.colorScheme = theme;
		root.classList.toggle("dark", theme === "dark");
	}, [theme]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleSystemThemeChange = (event: MediaQueryListEvent) => {
			if (!isSystemTheme) return;

			setThemeState(event.matches ? "dark" : "light");
		};

		mediaQuery.addEventListener("change", handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener("change", handleSystemThemeChange);
		};
	}, [isSystemTheme]);

	const setTheme = useCallback((nextTheme: Theme) => {
		window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
		setIsSystemTheme(false);
		setThemeState(nextTheme);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeState((currentTheme) => {
			const nextTheme = currentTheme === "light" ? "dark" : "light";

			window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
			setIsSystemTheme(false);

			return nextTheme;
		});
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
