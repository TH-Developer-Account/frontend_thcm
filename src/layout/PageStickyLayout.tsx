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
			className={`h-[calc(100vh-24px)] min-h-0 overflow-hidden bg-transparent ${className}`}
		>
			{/* Header - fixed inside parent */}
			<div
				className={`shrink-0 bg-white border border-zinc-200 rounded-sm z-30 mb-2 ${headerClassName}`}
			>
				{header}
			</div>

			{/* Body */}
			<div className="grid grid-cols-[200px_1fr] gap-2 min-h-0  h-[calc(100%-90px)]">
				{/* Sidebar - fixed inside parent */}
				<aside className={`sticky top-0 self-start ${sidebarClassName}`}>
					{sidebar}
				</aside>

				{/* Only this scrolls */}
				<main
					className={`content-box overflow-y-auto scrollbar-sleek ${contentClassName}`}
				>
					{children}
				</main>
			</div>
		</div>
	);
};

export default PageStickyLayout;
