import { type MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main className={`flex-1 overflow-auto bg-gray-100 p-6 ${className ?? ""}`}>
			{children}
		</main>
	);
};
