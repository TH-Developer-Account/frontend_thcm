import { useContext } from "react";

import { ThemeContext } from "./theme.context";
import type { ThemeContextValue } from "./theme.types";

export const useTheme = (): ThemeContextValue => {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used inside ThemeProvider");
	}

	return context;
};
