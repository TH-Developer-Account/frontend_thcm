// toast types

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastInput = {
	type?: ToastVariant;
	title?: string;
	description?: string;
	actionText?: string;
	onAction?: () => void;
};

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
