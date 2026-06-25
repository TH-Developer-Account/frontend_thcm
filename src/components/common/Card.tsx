import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "subtle" | "outlined" | "flat";

export type CardPadding = "none" | "compact" | "default" | "spacious";

export type CardProps = Omit<
	HTMLAttributes<HTMLElement>,
	"title" | "children"
> & {
	title?: ReactNode;
	subtitle?: ReactNode;
	actions?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;

	/**
	 * Changes the card surface treatment without allowing
	 * page-specific colors or visual overrides.
	 */
	variant?: CardVariant;

	/**
	 * Controls content padding.
	 *
	 * Use "none" when the child component owns its spacing,
	 * such as a table or full-width form.
	 */
	padding?: CardPadding;

	/**
	 * Semantic container element.
	 */
	as?: ElementType;

	/**
	 * Heading level used when title is a string or normal node.
	 */
	titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";

	headerClassName?: string;
	bodyClassName?: string;
	footerClassName?: string;

	loading?: boolean;
	disabled?: boolean;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

export default function Card({
	title,
	subtitle,
	actions,
	children,
	footer,
	variant = "default",
	padding = "default",
	as: Component = "section",
	titleAs: TitleComponent = "h3",
	className = "",
	headerClassName = "",
	bodyClassName = "",
	footerClassName = "",
	loading = false,
	disabled = false,
	"aria-busy": ariaBusy,
	"aria-disabled": ariaDisabled,
	...props
}: CardProps) {
	const hasHeader = Boolean(title || subtitle || actions);
	const hasFooter = Boolean(footer);

	return (
		<Component
			className={joinClassNames(
				"ui-card",
				`ui-card-${variant}`,
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
