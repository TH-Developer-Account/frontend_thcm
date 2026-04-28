// PageSectionLayout.tsx
import React from "react";

type PageSectionLayoutProps = {
	children: React.ReactNode;
	className?: string;
};

type PageSectionProps = {
	children: React.ReactNode;
	className?: string;
};

const PageSectionLayout = ({
	children,
	className = "",
}: PageSectionLayoutProps) => {
	return <div className={`page-stack-layout ${className}`}>{children}</div>;
};

export const PageSection = ({ children, className = "" }: PageSectionProps) => {
	return (
		<div className={`page-stack-section content-box  ${className}`}>
			{children}
		</div>
	);
};

export default PageSectionLayout;
