import type { ToastVariant } from "../../components/common/Toast";

export type ToastInput = {
	type?: ToastVariant;
	title?: string;
	description?: string;
	actionText?: string;
	onAction?: () => void;
};
