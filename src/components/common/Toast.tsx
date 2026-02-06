import React from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
	id: string;
	type?: ToastVariant;
	title?: string;
	description: string;
	onClose?: () => void;
	actionText?: string;
	onAction?: () => void;
	className?: string;
}
type ToastStyle = {
	wrapper: string;
	iconBg: string;
	icon: string;
	title: string;
	desc: string;
};
const toastStyles: Record<ToastVariant, ToastStyle> = {
	success: {
		wrapper: "bg-green-50 border-green-200",
		iconBg: "bg-green-500",
		icon: "✓",
		title: "text-green-900",
		desc: "text-green-700",
	},
	info: {
		wrapper: "bg-blue-50 border-blue-200",
		iconBg: "bg-blue-500",
		icon: "i",
		title: "text-blue-900",
		desc: "text-blue-700",
	},
	warning: {
		wrapper: "bg-yellow-50 border-yellow-200",
		iconBg: "bg-yellow-500",
		icon: "!",
		title: "text-yellow-900",
		desc: "text-yellow-700",
	},
	error: {
		wrapper: "bg-red-50 border-red-200",
		iconBg: "bg-red-500",
		icon: "✕",
		title: "text-red-900",
		desc: "text-red-700",
	},
};

export const Toast: React.FC<ToastProps> = ({
	type = "info", // ✅ default
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
		flex items-start gap-2 sm:gap-4
		p-2 sm:p-4
		border rounded-lg sm:rounded-xl
		${styles.wrapper}
		${className}
	`}
		>
			{/* Icon */}
			<div
				className={`
			flex items-center justify-center
			w-8 h-8 sm:w-10 sm:h-10
			rounded-full
			text-white text-sm sm:text-base font-bold
			${styles.iconBg}
		`}
			>
				{styles.icon}
			</div>

			{/* Content */}
			<div className="flex-1">
				<h4
					className={`
				font-semibold
				text-xs sm:text-sm
				${styles.title}
			`}
				>
					{title}
				</h4>

				<p
					className={`
				mt-0.5 sm:mt-1
				text-xs sm:text-sm
				leading-snug sm:leading-normal
				${styles.desc}
			`}
				>
					{description}{" "}
					{actionText && (
						<button
							onClick={onAction}
							className="underline font-medium hover:opacity-80"
						>
							{actionText}
						</button>
					)}
				</p>
			</div>

			{/* Close */}
			{onClose && (
				<button
					onClick={onClose}
					className="
				text-gray-400 hover:text-gray-600
				text-sm sm:text-base
				leading-none
			"
				>
					✕
				</button>
			)}
		</div>
	);
};
