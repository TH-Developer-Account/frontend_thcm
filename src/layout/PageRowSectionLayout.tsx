// PageRowSectionLayout.tsx
import React from "react";

type PageRowSectionLayoutProps = {
	header_children: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	stickyHeader?: boolean;
	stickyTop?: string;
};

const PageRowSectionLayout = ({
	header_children,
	children,
	className = "",
	headerClassName = "",
	contentClassName = "",
	stickyHeader = false,
	stickyTop = "top-0",
}: PageRowSectionLayoutProps) => {
	return (
		<div className="h-[92dvh] min-h-0 flex flex-col overflow-hidden gap-2 w-full">
			<div
				className={`${headerClassName} ${
					stickyHeader
						? `sticky ${stickyTop} z-30 bg-white border-b border-zinc-200 shrink-0`
						: "shrink-0 mt-4"
				}`}
			>
				<div className="page-stack-layout">
					<div className="page-stack-section content-box">
						<div className={className}>{header_children}</div>
					</div>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto scrollbar-sleek">
				<div className="page-stack-layout">
					<div className="page-stack-section content-box">
						<div className={`${className} ${contentClassName}`}>{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PageRowSectionLayout;
