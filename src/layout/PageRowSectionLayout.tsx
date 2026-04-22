import React from "react";
import PageSectionLayout, { PageSection } from "./PageSectionLayout";

type PageRowSectionLayoutProps = {
	header_children: React.ReactNode;
	children: React.ReactNode;
	className?: string;
};

const PageRowSectionLayout = ({
	header_children,
	children,
	className = "",
}: PageRowSectionLayoutProps) => {
	return (
		<PageSectionLayout>
			<PageSection>
				<div className={className}>{header_children}</div>
			</PageSection>
			<PageSection>
				<div className={className}>{children}</div>
			</PageSection>
		</PageSectionLayout>
	);
};

export default PageRowSectionLayout;
