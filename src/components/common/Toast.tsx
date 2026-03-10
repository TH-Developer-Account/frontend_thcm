import React from "react";
import { type ToastProps } from "./Toast/toast.types";
import { toastStyles } from "../styles.constant";

export const Toast: React.FC<ToastProps> = ({
	type = "info",
	title,
	description,
	onClose,
	actionText,
	onAction,
	className,
}: ToastProps) => {
	if (!type) return null;

	const styles = toastStyles[type];

	return (
		<div
			className={`
				toast
				${styles.wrapper}
				${className}
			`}
		>
			{/* Icon */}
			<div
				className={`
					toast-icon
					${styles.iconBg}
				`}
			>
				{styles.icon}
			</div>

			{/* Content */}
			<div className="toast-content">
				<h4
					className={`
						toast-title
						${styles.title}
					`}
				>
					{title}
				</h4>

				<p
					className={`
						toast-desc
						${styles.desc}
					`}
				>
					{description}{" "}
					{actionText && (
						<button onClick={onAction} className="toast-action">
							{actionText}
						</button>
					)}
				</p>
			</div>

			{/* Close */}
			{onClose && (
				<button onClick={onClose} className="toast-close">
					✕
				</button>
			)}
		</div>
	);
};
