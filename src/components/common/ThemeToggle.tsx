// ─────────────────────────────────────────────
//  THEME TOGGLE COMPONENT

import { useTheme } from "../../providers/ThemeContext";

// ─────────────────────────────────────────────
export const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	return (
		<div
			className="flex items-center gap-2"
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			<span
				style={{
					fontSize: 13,
					opacity: isDark ? 0.4 : 1,
					transition: "opacity 0.3s",
					color: "#f59e0b",
				}}
			>
				☀
			</span>
			<button
				onClick={toggleTheme}
				className={`tt-track ${isDark ? "dark" : "light"}`}
				aria-label="Toggle theme"
			>
				<span className={`tt-thumb ${isDark ? "dark" : "light"}`}>
					{isDark ? "🌙" : "☀️"}
				</span>
			</button>
			<span
				style={{
					fontSize: 13,
					opacity: isDark ? 1 : 0.4,
					transition: "opacity 0.3s",
					color: "#6366f1",
				}}
			>
				🌙
			</span>
		</div>
	);
};
