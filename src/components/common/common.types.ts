// badge and button types
export type TableUserStatus =
	| "Active"
	| "Blocked"
	| "Inactive"
	| "active"
	| "inactive"
	| "blocked";
export type EPCStatus =
	| "Approved"
	| "Recommended"
	| "Pending"
	| "Completed"
	| "Submitted"
	| "Sent Back"
	| "Report Submitted"
	| "Cancelled";

export type GeneralStatus = EPCStatus | TableUserStatus;

// toast types

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
export type ToastStyle = {
	wrapper: string;
	iconBg: string;
	icon: string;
	title: string;
	desc: string;
};
export const toastStyles: Record<ToastVariant, ToastStyle> = {
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
