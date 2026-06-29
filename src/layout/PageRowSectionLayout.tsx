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
	 * The complete content section owns vertical scrolling.
	 *
	 * contained:
	 * The content section fills the available desktop height.
	 * A child such as DataTable owns the internal scrolling.
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
				<div className="page-row-layout-header-inner page-row-layout-section content-box">
					<div
						className={joinClassNames("page-row-layout-header-body", className)}
					>
						{header_children}
					</div>
				</div>
			</header>

			<div className="page-row-layout-content  content-box">
				<div className="page-row-layout-content-inner page-row-layout-section">
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
