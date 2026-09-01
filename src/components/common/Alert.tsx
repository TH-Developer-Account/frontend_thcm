import { useEffect, useState } from "react";
import { styles } from "../styles.constant";
import type { AlertCardProps } from "./common.types";
import Button from "./Button";
import { X } from "lucide-react";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function Alert({
	variant,
	type = "box",
	title,
	description,
	primaryAction,
	secondaryAction,
	dismissible = false,
	autoHideMs,
	onDismiss,
}: AlertCardProps) {
	const { icon, iconBg } = styles[variant];
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
			className={joinClassNames(
				"alert",
				isBanner ? "alert-banner" : "alert-box",
				`alert-${variant}`,
			)}
			role={variant === "error" || variant === "warning" ? "alert" : "status"}
		>
			<div
				className={joinClassNames("alert-icon-wrapper", !isBanner && iconBg)}
				aria-hidden="true"
			>
				<span className="alert-icon">{icon}</span>
			</div>

			<div className="alert-content">
				<h3 className="alert-title">{title}</h3>

				{description ? (
					<p className="alert-description">{description}</p>
				) : null}
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
