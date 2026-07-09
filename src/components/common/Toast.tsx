import React from "react";
import { type ToastProps } from "../../context/Toast/toast.types";
import { toastStyles } from "../styles.constant";

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

	return (
		<div className={`toast ${styles.wrapper} ${className}`}>
			<div className={`toast-icon ${styles.iconBg}`} aria-hidden="true">
				<span className="toast-icon-symbol">{styles.icon}</span>
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
					✕
				</button>
			)}
		</div>
	);
};
