import React from "react";

type PageStickyLayoutProps = {
	header: React.ReactNode;
	sidebar?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	headerClassName?: string;
	sidebarClassName?: string;
	contentClassName?: string;
};

const PageStickyLayout = ({
	header,
	sidebar,
	children,
	className = "",
	headerClassName = "",
	sidebarClassName = "",
	contentClassName = "",
}: PageStickyLayoutProps) => {
	return (
		<div
			className={`h-[calc(100vh-80px)] min-h-0 overflow-hidden bg-transparent flex flex-col ${className}`}
		>
			{/* Header */}
			<div
				className={`shrink-0 bg-white border border-zinc-200 rounded-sm z-30 mb-2 ${headerClassName}`}
			>
				{header}
			</div>

			{/* Body */}
			<div className="flex-1 min-h-0 grid grid-cols-[200px_1fr] gap-2 overflow-hidden">
				<aside
					className={`min-h-0 overflow-y-auto scrollbar-sleek ${sidebarClassName}`}
				>
					{sidebar}
				</aside>

				<main
					className={`min-h-0 overflow-y-auto scrollbar-sleek ${contentClassName}`}
				>
					{children}
				</main>
			</div>
		</div>
	);
};

export default PageStickyLayout;
