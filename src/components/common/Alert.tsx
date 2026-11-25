import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	Info,
	X,
	XCircle,
} from "lucide-react";
import { styles } from "../styles.constant";
import type { AlertCardProps, AlertVariant } from "./common.types";
import Button from "./Button";

// Semantic icons (previously the text glyphs "!", "i", "×", "✓").
const ALERT_ICONS: Record<AlertVariant, ComponentType<SVGProps<SVGSVGElement>>> = {
	info: Info,
	success: CheckCircle2,
	warning: AlertTriangle,
	error: XCircle,
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function Alert({
	variant,
	type = "box",
	title,
	description,
	children,
	titleAs: TitleTag = "h3",
	className,
	id,
	primaryAction,
	secondaryAction,
	dismissible = false,
	autoHideMs,
	onDismiss,
}: AlertCardProps) {
	const { iconBg } = styles[variant];
	const Icon = ALERT_ICONS[variant];
	const [isVisible, setIsVisible] = useState(true);

	const isBanner = type === "banner";
	const hasActions = Boolean(primaryAction || secondaryAction);

	const handleDismiss = () => {
		setIsVisible(false);
		onDismiss?.();
	};

	// Auto-hide after `autoHideMs`, if provided. Re-arms whenever the alert's
	// identity (title+description+autoHideMs) changes, so a fresh status
	// change restarts the timer instead of inheriting the previous one.
	useEffect(() => {
		if (!autoHideMs) return;

		const timer = window.setTimeout(() => {
			setIsVisible(false);
			onDismiss?.();
		}, autoHideMs);

		return () => window.clearTimeout(timer);
	}, [autoHideMs, title, description, onDismiss]);

	if (!isVisible) return null;

	return (
		<div
			id={id}
			className={joinClassNames(
				"alert",
				isBanner ? "alert-banner" : "alert-box",
				`alert-${variant}`,
				className,
			)}
			role={variant === "error" || variant === "warning" ? "alert" : "status"}
		>
			<div
				className={joinClassNames("alert-icon-wrapper", !isBanner && iconBg)}
				aria-hidden="true"
			>
				<span className="alert-icon">
					<Icon />
				</span>
			</div>

			<div className="alert-content">
				<TitleTag className="alert-title">{title}</TitleTag>

				{description ? (
					typeof description === "string" || typeof description === "number" ? (
						<p className="alert-description">{description}</p>
					) : (
						<div className="alert-description">{description}</div>
					)
				) : null}

				{children ? <div className="alert-body">{children}</div> : null}
			</div>

			{hasActions ? (
				<div className="alert-actions">
					{secondaryAction ? (
						<button
							type="button"
							onClick={secondaryAction.onClick}
							className="alert-btn alert-btn-secondary"
						>
							{secondaryAction.label}
						</button>
					) : null}

					{primaryAction ? (
						<button
							type="button"
							onClick={primaryAction.onClick}
							className={joinClassNames(
								"alert-btn alert-btn-primary",
								variant === "error" && "alert-btn-danger",
							)}
						>
							{primaryAction.label}
						</button>
					) : null}
				</div>
			) : null}

			{dismissible ? (
				<Button
					type="button"
					onClick={handleDismiss}
					aria-label="Dismiss"
					className="alert-dismiss"
					appearance="icon"
					variant="transparent"
					Icon={X}
				/>
			) : null}
		</div>
	);
}
