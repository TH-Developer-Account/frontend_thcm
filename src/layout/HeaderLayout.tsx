import React from "react";

type HeaderLayoutProps = {
	onToggleSidebar: () => void;
	children?: React.ReactNode;
};

export const HeaderLayout = ({
	onToggleSidebar,
	children,
}: HeaderLayoutProps) => {
	return (
		<header className="h-14 flex items-center gap-3 px-4 border-b header px-4 sm:px-6 py-2 flex items-center text-white">
			<button
				onClick={onToggleSidebar}
				className="p-2 rounded-md hover:bg-gray-50  hover:text-black transition-transform duration-300 ease-in-out cursor-pointer"
				aria-label="Toggle sidebar"
			>
				☰
			</button>
			<div className="flex justify-between items-center w-full">{children}</div>
		</header>
	);
};
