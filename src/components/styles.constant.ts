import type { ToastStyle, ToastVariant } from "../context/Toast/toast.types";
import { TONE_BADGE_CLASS, resolveStatusTone, resolveVariantTone } from "./common/status";

// Status/variant → badge class now lives in ./common/status.ts (single source).
// These wrappers stay for backward compatibility.
export const resolveStatusStyle = ({ status }: { status?: string | null }) =>
	TONE_BADGE_CLASS[resolveStatusTone(status) ?? "neutral"];

export const resolveVariantStyle = ({ variant }: { variant?: string | null }) => {
	const tone = resolveVariantTone(variant);
	return tone ? TONE_BADGE_CLASS[tone] : "badge-outline";
};

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
