import { type MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main
			className={`flex-1 overflow-y-auto scrollbar-sleek   px-8 ${className ?? ""}`}
		>
			{children}
		</main>
	);
};
