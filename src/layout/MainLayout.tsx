import { type MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main className={`flex-1 overflow-auto bg-white px-8 ${className ?? ""}`}>
			{children}
		</main>
	);
};
