import type { MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main className={["main-content", className].filter(Boolean).join(" ")}>
			{children}
		</main>
	);
};
