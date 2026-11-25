import type { MainLayoutProps } from "./layout.types";

export const MAIN_CONTENT_ID = "main-content";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		// tabIndex={-1}: lets the "Skip to main content" link move focus here
		// without adding the region to the normal Tab order.
		<main
			id={MAIN_CONTENT_ID}
			tabIndex={-1}
			className={["main-content", className].filter(Boolean).join(" ")}
		>
			<div className="app-page-outlet">{children}</div>
		</main>
	);
};
