import { type MainLayoutProps } from "./layout.types";

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main
			className={`flex-1 overflow-y-auto scrollbar-sleek bg-zinc-50  px-8 ${className ?? ""}`}
		>
			{children}
		</main>
	);
};
