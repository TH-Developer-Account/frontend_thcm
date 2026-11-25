import type { ReactNode } from "react";

import PageNavigation from "./PageNavigation/PageNavigation";
import type { PageNavigationProps } from "./PageNavigation/pageNavigation.types";

export type PageHeaderMetaItem = {
	/** Short label, e.g. "Initiated". Omit for a bare value. */
	label?: string;
	value: ReactNode;
};

type PageHeaderProps = {
	headerText?: string;
	/** Status badge (or any node) shown beside the title, e.g. <Badge>Pending</Badge>. */
	status?: ReactNode;
	/** Key facts under the title: reference, initiator, dates. Rendered as a <dl>. */
	metaItems?: readonly PageHeaderMetaItem[];
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
	status,
	metaItems,
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
	const visibleMeta = (metaItems ?? []).filter(
		(item) => item.value !== null && item.value !== undefined && item.value !== "",
	);
	const hasCopy = Boolean(
		headerText || subtitleText || metaText || visibleMeta.length > 0,
	);
	const hasPrimaryContent = Boolean(hasCopy || headerChildren || navigation);

	return (
		<header className={joinClassNames("page-header", className)}>
			{navigation ? (
				<div className="page-header-navigation">
					<PageNavigation {...navigation} />
				</div>
			) : null}
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
									status ? (
										<div className="page-header-title-row">
											<h2 className="page-header-title">{headerText}</h2>
											<span className="page-header-status">{status}</span>
										</div>
									) : (
										<h2 className="page-header-title">{headerText}</h2>
									)
								) : null}

								{subtitleText ? (
									<p className="page-header-subtitle">{subtitleText}</p>
								) : null}

								{metaText ? (
									<p className="page-header-meta">{metaText}</p>
								) : null}

								{visibleMeta.length > 0 ? (
									<dl className="page-header-meta-list">
										{visibleMeta.map((item, index) => (
											<div
												key={item.label ?? index}
												className="page-header-meta-item"
											>
												{item.label ? (
													<dt className="page-header-meta-label">
														{item.label}
													</dt>
												) : null}
												<dd className="page-header-meta-value">{item.value}</dd>
											</div>
										))}
									</dl>
								) : null}
							</div>
						) : null}

						{headerChildren ? (
							<div className="page-header-extra">{headerChildren}</div>
						) : null}
					</div>
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
