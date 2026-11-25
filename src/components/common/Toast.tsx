import React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { type ToastProps, type ToastVariant } from "../../context/Toast/toast.types";
import { toastStyles } from "../styles.constant";

const TOAST_ICONS: Record<ToastVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
	info: Info,
	success: CheckCircle2,
	warning: AlertTriangle,
	error: XCircle,
};

export const Toast: React.FC<ToastProps> = ({
	type = "info",
	title,
	description,
	onClose,
	actionText,
	onAction,
	className = "",
}: ToastProps) => {
	if (!type) return null;

	const styles = toastStyles[type];
	const Icon = TOAST_ICONS[type];

	// The provider's container is a polite live region; errors interrupt.
	return (
		<div
			className={`toast ${styles.wrapper} ${className}`}
			role={type === "error" ? "alert" : undefined}
		>
			<div className={`toast-icon ${styles.iconBg}`} aria-hidden="true">
				<Icon className="toast-icon-svg" />
			</div>

			<div className="toast-content">
				<h4 className={`toast-title ${styles.title}`}>{title}</h4>

				{description && (
					<p className={`toast-desc ${styles.desc}`}>
						{description}{" "}
						{actionText && (
							<button type="button" onClick={onAction} className="toast-action">
								{actionText}
							</button>
						)}
					</p>
				)}
			</div>

			{onClose && (
				<button
					type="button"
					onClick={onClose}
					className="toast-close"
					aria-label="Close notification"
				>
					<X aria-hidden="true" />
				</button>
			)}
		</div>
	);
};
