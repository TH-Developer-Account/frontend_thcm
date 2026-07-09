import type { CSSProperties, ReactNode } from "react";

type PageStickyLayoutProps = {
	header: ReactNode;
	sidebar?: ReactNode;
	children: ReactNode;
	className?: string;
	headerClassName?: string;
	sidebarClassName?: string;
	contentClassName?: string;
	headerOffset?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const PageStickyLayout = ({
	header,
	sidebar,
	children,
	className = "",
	headerClassName = "",
	sidebarClassName = "",
	contentClassName = "",
	headerOffset = "0px",
}: PageStickyLayoutProps) => {
	const layoutStyle = {
		"--page-sticky-header-offset": headerOffset,
	} as CSSProperties;

	return (
		<section
			className={joinClassNames("page-sticky-layout", className)}
			style={layoutStyle}
		>
			<header
				className={joinClassNames("page-sticky-layout-header", headerClassName)}
			>
				{header}
			</header>

			<div className="page-sticky-layout-body">
				{sidebar ? (
					<aside
						className={joinClassNames(
							"page-sticky-layout-sidebar",
							"scrollbar-sleek",
							sidebarClassName,
						)}
					>
						{sidebar}
					</aside>
				) : null}

				<main
					className={joinClassNames(
						"page-sticky-layout-content",
						contentClassName,
					)}
				>
					{children}
				</main>
			</div>
		</section>
	);
};

export default PageStickyLayout;
