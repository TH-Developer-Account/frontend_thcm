import React from "react";
import PageSectionLayout, { PageSection } from "./PageSectionLayout";

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
		<div className="h-[100dvh] min-h-0 flex flex-col overflow-hidden gap-2">
			<div
				className={`${headerClassName} ${
					stickyHeader
						? `sticky ${stickyTop} z-30 bg-white border-b border-zinc-200 shrink-0`
						: "shrink-0"
				}`}
			>
				<PageSectionLayout>
					<PageSection>
						<div className={className}>{header_children}</div>
					</PageSection>
				</PageSectionLayout>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto scrollbar-sleek">
				<PageSectionLayout>
					<PageSection>
						<div className={`${className} ${contentClassName}`}>{children}</div>
					</PageSection>
				</PageSectionLayout>
			</div>
		</div>
	);
};

export default PageRowSectionLayout;
