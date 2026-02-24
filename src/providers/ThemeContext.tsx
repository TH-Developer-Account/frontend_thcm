import { createContext, useCallback, useContext, useState } from "react";
type Props = {
	children: React.ReactNode;
};
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export const ThemeProvider: React.FC<Props> = ({ children }) => {
	const [theme, setTheme] = useState("light");
	const toggleTheme = useCallback(
		() => setTheme((t) => (t === "light" ? "dark" : "light")),
		[],
	);
	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};
export const useTheme = () => useContext(ThemeContext);
