import React from "react";

type MainLayoutProps = {
	children: React.ReactNode;
	className?: string;
};

export const MainLayout = ({ children, className }: MainLayoutProps) => {
	return (
		<main className={`flex-1 overflow-auto bg-gray-100 p-6 ${className ?? ""}`}>
			{children}
		</main>
	);
};
