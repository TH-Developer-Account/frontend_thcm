import type { ToastStyle, ToastVariant } from "./common/Toast/toast.types";

const STATUS_STYLE_MAP: Record<string, string> = {
	approved: "bg-teal-100 text-teal-800 ring-teal-200",

	completed: "bg-green-100 text-green-800 ring-green-200  ",

	cancelled: "bg-red-100 text-red-800 ring-red-200",

	"sent back": "bg-orange-100 text-orange-800 ring-orange-200",

	pending: "bg-amber-100 text-amber-800 ring-amber-200 ",

	submitted: "bg-blue-100 text-blue-800 ring-blue-200",

	"report submitted": "bg-sky-100 text-sky-800 ring-sky-200",

	recommended: "bg-violet-100 text-violet-800 ring-violet-200",

	blocked: "bg-rose-100 text-rose-800 ring-rose-200",
	brand: "bg-[#f35a00] text-white",
};

export const resolveStatusStyle = ({ status }: { status?: string }): string => {
	if (!status) return "bg-transparent text-zinc-900 border-orange-500";
	return (
		STATUS_STYLE_MAP[status] ?? "bg-transparent text-zinc-900 border-orange-500"
	);
};

export const resolveVariantStyle = (variant: string): string => {
	switch (variant) {
		case "brand":
			return "bg-[#f35a00] text-white";
		case "success":
			return "bg-green-100 text-green-800";
		case "warning":
			return "bg-yellow-100 text-yellow-800";
		case "danger":
			return "bg-red-100 text-red-800";
		case "disable":
			return "bg-gray-100 text-gray-800";
		case "primary":
			return "bg-blue-100 text-blue-800";
		default:
			return "bg-zinc-500 text-zinc-800";
	}
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

export const styles = {
	warning: {
		icon: "⚠️",
		iconBg: "bg-yellow-100 text-yellow-600",
	},
	info: {
		icon: "ℹ️",
		iconBg: "bg-blue-100 text-blue-600",
	},
	error: {
		icon: "⛔",
		iconBg: "bg-red-100 text-red-600",
	},
	success: {
		icon: "✅",
		iconBg: "bg-green-100 text-green-600",
	},
};

export const APPROVAL_DOT_STATUS_COMPLETED: Record<string, string> = {
	approved: "bg-teal-100 text-teal-600 ring-teal-200",

	completed: "bg-green-100 text-green-600 ring-green-200",

	cancelled: "bg-red-100 text-red-600 ring-red-200",

	"sent back": "bg-orange-100 text-orange-600 ring-orange-200",

	pending: "bg-amber-100 text-amber-600 ring-amber-200 ",

	submitted: "bg-blue-100 text-blue-600 ring-blue-200",

	"report submitted": "bg-sky-100 text-sky-600 ring-sky-200",

	recommended: "bg-violet-100 text-violet-600 ring-violet-200",

	blocked: "bg-rose-100 text-rose-600 ring-rose-200",
};

export const APPROVAL_DOT_STATUS_ACTIVE: Record<string, string> = {
	approved:
		"bg-teal-200 text-teal-600 ring-teal-300  shadow-lg border border-white",

	completed:
		"bg-green-200 text-green-600 ring-green-400  shadow-lg border border-white",

	cancelled:
		"bg-red-200 text-red-600 ring-red-300  shadow-lg border border-white",

	"sent back":
		"bg-orange-200 text-orange-600 ring-orange-300  shadow-lg border border-white",

	pending: "bg-amber-200 text-amber-600 ring-amber-300  shadow-lg border-white",

	submitted:
		"bg-blue-200 text-blue-600 ring-blue-300  shadow-lg border border-white",

	"report submitted":
		"bg-sky-200 text-sky-600 ring-sky-300  shadow-lg border border-white",

	recommended:
		"bg-violet-200 text-violet-600 ring-violet-300  shadow-lg border border-white",

	blocked:
		"bg-rose-200 text-rose-600 ring-rose-300  shadow-lg border border-white",
};
