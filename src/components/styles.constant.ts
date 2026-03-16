import type { ToastStyle, ToastVariant } from "./common/Toast/toast.types";

const STATUS_STYLE_MAP: Record<string, string> = {
	Active: "bg-green-100 text-green-900",
	active: "bg-green-100 text-green-900",
	Approved: "bg-indigo-100 text-indigo-900 ",

	Recommended: "bg-pink-100 text-pink-900 ",
	Submitted: "bg-violet-100 text-violet-900",
	"Report Submitted": "bg-sky-100 text-sky-900",

	Pending: "bg-amber-100 text-amber-90",

	Cancelled: "bg-red-100 text-red-900",
	Blocked: "bg-rose-100 text-rose-900",
	blocked: "bg-rose-100 text-rose-900",
	"Sent Back": "bg-orange-100 text-orange-900",
	Inactive: "bg-gray-200 text-gray-900",
	inactive: "bg-gray-200 text-gray-900",
	brand: "bg-[#f35a00] text-white",
	Completed: "bg-emerald-100 text-emerald-900",
};

export const resolveStatusStyle = ({ status }: { status?: string }): string => {
	if (!status) return "bg-transparent text-zinc-900";
	return STATUS_STYLE_MAP[status] ?? "bg-transparent text-zinc-900";
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

export const APPROVAL_DOT_STATUS: Record<string, string> = {
	approved: "bg-indigo-200 text-indigo-900 ring-indigo-100",

	recommended: "bg-pink-200 text-pink-900 ring-pink-100",

	submitted: "bg-violet-200 text-violet-900 ring-violet-100",

	"report submitted": "bg-sky-200 text-sky-900 ring-sky-100",

	pending: "bg-amber-200 text-amber-900 ring-amber-100",

	completed: "bg-emerald-200 text-emerald-900 ring-emerald-100",

	cancelled: "bg-red-200 text-red-900 ring-red-100",

	blocked: "bg-rose-200 text-rose-900 ring-rose-100",

	"sent back": "bg-orange-200 text-orange-900 ring-orange-100",
};
export const APPROVAL_DOT_STATUS_COMPLETED: Record<string, string> = {
	approved: "bg-indigo-200 text-indigo-900  ring-indigo-300",

	recommended: "bg-pink-200 text-pink-900  ring-pink-300",

	submitted: "bg-violet-200 text-violet-900  ring-violet-300",

	"report submitted": "bg-sky-200 text-sky-900  ring-sky-300",

	pending: "bg-amber-200 text-amber-900  ring-amber-300",

	completed: "bg-emerald-200 text-emerald-900  ring-emerald-300",

	cancelled: "bg-red-200 text-red-900  ring-red-300",

	blocked: "bg-rose-200 text-rose-900  ring-rose-300",

	"sent back": " bg-orange-200 text-orange-900  ring-orange-300",
};

export const APPROVAL_LINE_COLOR: Record<string, string> = {
	approved: "bg-indigo-400",
	recommended: "bg-pink-400",
	submitted: "bg-violet-400",
	"report submitted": "bg-sky-400",
	pending: "bg-amber-400",
	cancelled: "bg-red-400",
	"sent back": "bg-orange-400",
	completed: "bg-emerald-400",
};
