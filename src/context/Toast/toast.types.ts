export type ToastVariant = "success" | "info" | "warning" | "error";

export type ToastStyle = {
	wrapper: string;
	iconBg: string;
	icon: string;
	title: string;
	desc: string;
};

export type ToastInput = {
	type?: ToastVariant;
	title: string;
	description?: string;
	actionText?: string;
	onAction?: () => void;
};

export type ToastProps = ToastInput & {
	id?: string;
	onClose?: () => void;
	className?: string;
};
