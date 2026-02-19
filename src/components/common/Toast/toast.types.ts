import type { ToastVariant } from "../Toast";

export type ToastInput = {
	type?: ToastVariant;
	title?: string;
	description?: string;
	actionText?: string;
	onAction?: () => void;
};
