import type { ReactNode } from "react";

import PageNavigation from "./PageNavigation/PageNavigation";
import type { PageNavigationProps } from "./PageNavigation/pageNavigation.types";

type PageHeaderProps = {
	headerText?: string;
	subtitleText?: string;
	metaText?: string | null;
	className?: string;
	contentClassName?: string;
	actionsClassName?: string;
	children?: ReactNode;
	navigation?: PageNavigationProps;
	headerChildren?: ReactNode;
	textAlign?: "left" | "center" | "right";
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export const PageHeader = ({
	headerText,
	subtitleText,
	metaText,
	className = "",
	contentClassName = "",
	actionsClassName = "",
	children,
	headerChildren,
	navigation,
	textAlign = "left",
}: PageHeaderProps) => {
	const hasCopy = Boolean(headerText || subtitleText || metaText);
	const hasPrimaryContent = Boolean(hasCopy || headerChildren || navigation);

	return (
		<header className={joinClassNames("page-header", className)}>
			{hasPrimaryContent ? (
				<div
					className={joinClassNames("page-header-primary", contentClassName)}
				>
					<div className="page-header-heading-group">
						{hasCopy ? (
							<div
								className={joinClassNames(
									"page-header-copy",
									`is-${textAlign}`,
								)}
							>
								{headerText ? (
									<h2 className="page-header-title">{headerText}</h2>
								) : null}

								{subtitleText ? (
									<p className="page-header-subtitle">{subtitleText}</p>
								) : null}

								{metaText ? (
									<p className="page-header-meta">{metaText}</p>
								) : null}
							</div>
						) : null}

						{headerChildren ? (
							<div className="page-header-extra">{headerChildren}</div>
						) : null}
					</div>

					{navigation ? (
						<div className="page-header-navigation">
							<PageNavigation {...navigation} />
						</div>
					) : null}
				</div>
			) : null}

			{children ? (
				<div
					className={joinClassNames("page-header-toolbar", actionsClassName)}
				>
					{children}
				</div>
			) : null}
		</header>
	);
};
