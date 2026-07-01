import type { CSSProperties, ReactNode } from "react";

type PageRowContentMode = "page-scroll" | "contained";

type PageRowSectionLayoutProps = {
	pageHeader?: ReactNode;
	header_children: ReactNode;
	children: ReactNode;
	className?: string;
	pageHeaderClassName?: string;
	headerClassName?: string;
	headerBodyClassName?: string;
	contentClassName?: string;
	contentBodyClassName?: string;
	stickyHeader?: boolean;
	stickyTop?: string;
	contentMode?: PageRowContentMode;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const PageRowSectionLayout = ({
	pageHeader,
	header_children,
	children,
	className = "",
	pageHeaderClassName = "",
	headerClassName = "",
	headerBodyClassName = "",
	contentClassName = "",
	contentBodyClassName = "",
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
				className,
			)}
			style={layoutStyle}
		>
			<header
				className={joinClassNames("page-row-layout-header", headerClassName)}
			>
				{pageHeader ? (
					<div
						className={joinClassNames(
							"page-row-layout-page-header",
							pageHeaderClassName,
						)}
					>
						{pageHeader}
					</div>
				) : null}

				<div className="page-row-layout-surface-header">
					<div
						className={joinClassNames(
							"page-row-layout-header-body",
							headerBodyClassName,
						)}
					>
						{header_children}
					</div>
				</div>
			</header>

			<div className="page-row-layout-surface-content">
				<div
					className={joinClassNames(
						"page-row-layout-content",
						contentClassName,
					)}
				>
					<div className="page-row-layout-content-inner">
						<div
							className={joinClassNames(
								"page-row-layout-content-body",
								contentBodyClassName,
							)}
						>
							{children}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default PageRowSectionLayout;
