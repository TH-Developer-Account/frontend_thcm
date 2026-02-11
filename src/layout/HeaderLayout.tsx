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
		<header className="h-14 flex items-center gap-3 px-4 border-b header px-4 sm:px-6 py-2 flex items-center text-white shadow-[0px_3px_12px_0px_rgba(0,0,0,0.2)] ">
			<button
				onClick={onToggleSidebar}
				className="p-2 rounded-md hover:bg-gray-50  hover:text-orange-600 transition-transform duration-300 ease-in-out cursor-pointer"
				aria-label="Toggle sidebar"
			>
				☰
			</button>
			<div className="flex justify-between items-center w-full">{children}</div>
		</header>
	);
};
