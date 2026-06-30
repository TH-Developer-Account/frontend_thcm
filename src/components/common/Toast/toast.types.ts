export type ToastVariant = "success" | "info" | "warning" | "error";

export type ToastStyle = {
	wrapper: string;
	iconBg: string;
	icon: string;
	title: string;
	desc: string;
};

export type ToastProps = {
	type?: ToastVariant;
	title: string;
	description?: string;
	onClose?: () => void;
	actionText?: string;
	onAction?: () => void;
	className?: string;
};
