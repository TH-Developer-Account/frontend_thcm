import type { ReactNode } from "react";

import type { NavigateButtonProps } from "../common/common.types";
import NavigateButton from "../common/NavigateButton";

type PageHeaderProps = {
	headerText?: string;
	subtitleText?: string;
	metaText?: string | null;
	className?: string;
	contentClassName?: string;
	actionsClassName?: string;
	children?: ReactNode;
	badgeProps?: NavigateButtonProps;
	header_children?: ReactNode;
	textAlign?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

export const PageHeader = ({
	headerText,
	subtitleText,
	metaText,
	className = "",
	contentClassName = "",
	actionsClassName = "",
	children,
	header_children,
	badgeProps,
	textAlign,
}: PageHeaderProps) => {
	const hasCopy = Boolean(headerText || subtitleText || metaText);

	return (
		<div className={joinClassNames("page-header", className)}>
			<div className={joinClassNames("page-header-primary", contentClassName)}>
				{badgeProps ? (
					<div className="page-header-badge-wrapper">
						<NavigateButton
							{...badgeProps}
							className={joinClassNames(
								"page-header-badge",
								badgeProps.className,
							)}
						/>
					</div>
				) : null}

				{hasCopy ? (
					<div className={`page-header-copy ${textAlign} `}>
						{headerText ? (
							<h2 className="page-header-title">{headerText}</h2>
						) : null}

						{subtitleText ? (
							<p className="page-header-subtitle">{subtitleText}</p>
						) : null}

						{metaText ? <p className="page-header-meta">{metaText}</p> : null}
					</div>
				) : null}
				<div>{header_children}</div>
			</div>

			{children ? (
				<div
					className={joinClassNames("page-header-toolbar", actionsClassName)}
				>
					{children}
				</div>
			) : null}
		</div>
	);
};
