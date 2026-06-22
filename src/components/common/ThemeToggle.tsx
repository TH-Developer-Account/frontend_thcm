import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../context/Theme/useTheme";

export const ThemeToggle = () => {
	const { isDark, toggleTheme } = useTheme();

	const label = isDark ? "Switch to light theme" : "Switch to dark theme";

	return (
		<button
			type="button"
			role="switch"
			aria-checked={isDark}
			aria-label={label}
			title={label}
			data-theme-state={isDark ? "dark" : "light"}
			className="app-theme-switch"
			onClick={toggleTheme}
		>
			<span className="app-theme-switch__track" aria-hidden="true">
				<span className="app-theme-switch__icon app-theme-switch__icon--sun">
					<Sun size={16} />
				</span>

				<span className="app-theme-switch__icon app-theme-switch__icon--moon">
					<Moon size={16} />
				</span>

				<span className="app-theme-switch__thumb" />
			</span>
		</button>
	);
};
