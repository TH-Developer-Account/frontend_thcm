import type { ToastStyle, ToastVariant } from "./common/Toast/toast.types";

const normalizeStyleKey = (value?: string | null) =>
	String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");

const STATUS_STYLE_MAP: Record<string, string> = {
	approved: "badge-success",
	completed: "badge-success",
	conducted: "badge-success",
	validated: "badge-success",
	report_validated: "badge-success",
	pending: "badge-pending",
	draft: "badge-pending",
	submitted: "badge-info",
	in_progress: "badge-info",
	report_submitted: "badge-info",
	report_resubmitted: "badge-info",
	clarify: "badge-warning",
	clarified: "badge-warning",
	clarification_requested: "badge-warning",
	report_clarification_requested: "badge-warning",
	rejected: "badge-danger",
	cancelled: "badge-danger",
	failed: "badge-danger",
	not_conducted: "badge-danger",
	deviation_raised: "badge-danger",
	deviation_in_progress: "badge-warning",
	closed: "badge-neutral",
	epc_closed: "badge-neutral",
	superseded: "badge-neutral",
};

export const resolveStatusStyle = ({ status }: { status?: string | null }) =>
	STATUS_STYLE_MAP[normalizeStyleKey(status)] ?? "badge";

const VARIANT_STYLE_MAP: Record<string, string> = {
	brand: "badge-brand",
	primary: "badge-brand",
	outline: "badge-outline",
	success: "badge-success",
	active: "badge-success",
	passed: "badge-success",
	danger: "badge-danger",
	inactive: "badge-neutral",
	failed: "badge-danger",
	warning: "badge-warning",
	pending: "badge-pending",
	info: "badge-info",
	neutral: "badge-neutral",
	disable: "badge-neutral",
};

export const resolveVariantStyle = ({ variant }: { variant?: string | null }) =>
	VARIANT_STYLE_MAP[normalizeStyleKey(variant)] ?? "badge-outline";

export const toastStyles: Record<ToastVariant, ToastStyle> = {
	success: {
		wrapper: "toast-success",
		iconBg: "toast-icon-success",
		icon: "✓",
		title: "",
		desc: "",
	},
	info: {
		wrapper: "toast-info",
		iconBg: "toast-icon-info",
		icon: "i",
		title: "",
		desc: "",
	},
	warning: {
		wrapper: "toast-warning",
		iconBg: "toast-icon-warning",
		icon: "!",
		title: "",
		desc: "",
	},
	error: {
		wrapper: "toast-error",
		iconBg: "toast-icon-error",
		icon: "×",
		title: "",
		desc: "",
	},
};

export const styles = {
	warning: { icon: "!", iconBg: "alert-icon-warning" },
	info: { icon: "i", iconBg: "alert-icon-info" },
	error: { icon: "×", iconBg: "alert-icon-error" },
	success: { icon: "✓", iconBg: "alert-icon-success" },
};
