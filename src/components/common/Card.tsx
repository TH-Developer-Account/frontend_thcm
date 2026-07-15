import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "subtle" | "outlined" | "flat";
export type CardPadding = "none" | "compact" | "default" | "spacious";
export type CardLayout = "default" | "listing";

export type CardProps = Omit<
	HTMLAttributes<HTMLElement>,
	"title" | "children"
> & {
	title?: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	size?: "default" | "small" | "medium" | "large";
	secondaryHeader?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;

	variant?: CardVariant;
	padding?: CardPadding;
	layout?: CardLayout;
	as?: ElementType;
	titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";

	headerClassName?: string;
	secondaryHeaderClassName?: string;
	bodyClassName?: string;
	footerClassName?: string;

	loading?: boolean;
	disabled?: boolean;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export default function Card({
	title,
	subtitle,
	actions,
	secondaryHeader,
	children,
	size,
	footer,
	variant = "default",
	padding = "default",
	layout = "default",
	as: Component = "section",
	titleAs: TitleComponent = "h3",
	className = "",
	headerClassName = "",
	secondaryHeaderClassName = "",
	bodyClassName = "",
	footerClassName = "",
	loading = false,
	disabled = false,
	"aria-busy": ariaBusy,
	"aria-disabled": ariaDisabled,
	...props
}: CardProps) {
	const hasHeader = Boolean(title || subtitle || actions);
	const hasSecondaryHeader = Boolean(secondaryHeader);
	const hasFooter = Boolean(footer);

	return (
		<Component
			className={joinClassNames(
				"ui-card",
				`ui-card-${size}`,
				`ui-card-${variant}`,
				`ui-card-layout-${layout}`,
				disabled && "ui-card-disabled",
				loading && "ui-card-loading",
				className,
			)}
			aria-busy={ariaBusy ?? loading}
			aria-disabled={ariaDisabled ?? disabled}
			{...props}
		>
			{hasHeader ? (
				<header className={joinClassNames("ui-card-header", headerClassName)}>
					<div className="ui-card-header-copy">
						{title ? (
							<TitleComponent className="ui-card-title">{title}</TitleComponent>
						) : null}

						{subtitle ? (
							<div className="ui-card-subtitle">{subtitle}</div>
						) : null}
					</div>

					{actions ? <div className="ui-card-actions">{actions}</div> : null}
				</header>
			) : null}

			{hasSecondaryHeader ? (
				<div
					className={joinClassNames(
						"ui-card-secondary-header",
						secondaryHeaderClassName,
					)}
				>
					{secondaryHeader}
				</div>
			) : null}

			<div
				className={joinClassNames(
					"ui-card-body",
					`ui-card-body-${padding}`,
					bodyClassName,
				)}
			>
				{loading ? (
					<div
						className="ui-card-loading-state"
						role="status"
						aria-live="polite"
					>
						<span className="ui-card-loading-indicator" aria-hidden="true" />
						<span>Loading content…</span>
					</div>
				) : (
					children
				)}
			</div>

			{hasFooter ? (
				<footer className={joinClassNames("ui-card-footer", footerClassName)}>
					{footer}
				</footer>
			) : null}
		</Component>
	);
}
