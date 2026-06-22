import type { CSSProperties, ReactNode } from "react";

type PageRowContentMode = "page-scroll" | "contained";

type PageRowSectionLayoutProps = {
	header_children: ReactNode;
	children: ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	stickyHeader?: boolean;
	stickyTop?: string;

	/**
	 * page-scroll:
	 * The whole content area scrolls. Use when the page contains
	 * multiple sections or content below the table.
	 *
	 * contained:
	 * The content fills the available desktop height. A child such
	 * as DataTable owns the internal scrolling region.
	 */
	contentMode?: PageRowContentMode;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const PageRowSectionLayout = ({
	header_children,
	children,
	className = "",
	headerClassName = "",
	contentClassName = "",
	stickyHeader = false,
	stickyTop = "0px",
	contentMode = "page-scroll",
}: PageRowSectionLayoutProps) => {
	const layoutStyle = {
		"--page-row-sticky-top": stickyTop,
	} as CSSProperties;

	return (
		<section
			className={joinClassNames(
				"page-row-layout",
				stickyHeader && "page-row-layout-sticky",
				contentMode === "contained"
					? "page-row-layout-contained"
					: "page-row-layout-page-scroll",
			)}
			style={layoutStyle}
		>
			<header
				className={joinClassNames("page-row-layout-header", headerClassName)}
			>
				<div className="page-row-layout-header-inner content-box page-stack-section">
					<div className={className}>{header_children}</div>
				</div>
			</header>

			<div className="page-row-layout-content">
				<div className="page-row-layout-content-inner content-box page-stack-section">
					<div
						className={joinClassNames(
							"page-row-layout-content-body",
							className,
							contentClassName,
						)}
					>
						{children}
					</div>
				</div>
			</div>
		</section>
	);
};

export default PageRowSectionLayout;
