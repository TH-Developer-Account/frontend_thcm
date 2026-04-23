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
		<PageSectionLayout>
			<PageSection>
				<div
					className={`${className} ${headerClassName} ${
						stickyHeader
							? `sticky ${stickyTop} z-30 bg-white border-b border-zinc-200`
							: ""
					}`}
				>
					{header_children}
				</div>
			</PageSection>

			<PageSection>
				<div className={`${className} ${contentClassName}`}>{children}</div>
			</PageSection>
		</PageSectionLayout>
	);
};

export default PageRowSectionLayout;
