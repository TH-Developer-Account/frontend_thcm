import type { ToastStyle, ToastVariant } from "./common/Toast/toast.types";

const STATUS_STYLE_MAP: Record<string, string> = {
	Active: "bg-green-100 text-green-800",
	active: "bg-green-100 text-green-800",
	Approved: "bg-green-100 text-green-800",

	Recommended: "bg-blue-100 text-blue-800",
	Submitted: "bg-purple-100 text-purple-800",
	"Report Submitted": "bg-orange-100 text-orange-800",

	Pending: "bg-yellow-100 text-yellow-800",

	Cancelled: "bg-red-100 text-red-800",
	Blocked: "bg-red-100 text-red-800",
	blocked: "bg-red-100 text-red-800",
	"Sent Back": "bg-gray-300 text-gray-800",
	Inactive: "bg-gray-300 text-gray-800",
	inactive: "bg-gray-300 text-gray-800",
	brand: "bg-[#f35a00] text-white",
	Completed: "bg-emerald-100 text-emerald-800",
};

export const resolveStatusStyle = ({ status }: { status?: string }): string => {
	if (!status) return "bg-zinc-100 text-zinc-900";
	return STATUS_STYLE_MAP[status] ?? "bg-zinc-100 text-zinc-900";
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
