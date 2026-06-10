import type { ToastStyle, ToastVariant } from "./common/Toast/toast.types";

const STATUS_STYLE_MAP: Record<string, string> = {
	approved: "bg-teal-100 text-teal-800 ring-teal-200",
	completed: "bg-green-100 text-green-800 ring-green-200  ",
	conducted: "bg-green-100 text-green-800 ring-green-200  ",
	cancelled: "bg-red-100 text-red-800 ring-red-200",
	pending: "bg-amber-100 text-amber-800 ring-amber-200 ",
	submitted: "bg-blue-100 text-blue-800 ring-blue-200",
	"report submitted": "bg-sky-100 text-sky-800 ring-sky-200",
	brand: "bg-[#f35a00] text-white",
	outline:
		"border border-orange-200 bg-orange-50 text-orange-700 hover:border-red-400 hover:bg-red-100",
	active: "bg-green-100 text-green-800 ",
	inactive: "bg-red-100 text-red-800 ",
	validated: "bg-green-100 text-green-800 ring-green-200  ",
	clarified: "bg-yellow-100 text-yellow-800 ring-yellow-200",
	"report clarified": "bg-yellow-100 text-yellow-800 ring-yellow-200",
	in_progress: "bg-blue-100 text-blue-800 ring-blue-200",
	deviated: "bg-red-100 text-red-800 ring-red-200",
	closed: "bg-gray-100 text-gray-800 ring-gray-200",
};

export const resolveStatusStyle = ({ status }: { status?: string }): string => {
	if (!status) return "bg-transparent border-orange-500";
	return STATUS_STYLE_MAP[status] ?? "bg-transparent  border-orange-500";
};

const VARIANT_STYLE_MAP: Record<string, string> = {
	brand: "bg-[#f35a00] text-white",

	success: "bg-green-100 text-green-800 ",
	active: "bg-green-100 text-green-800 ",

	danger: "bg-red-100 text-red-800 ",
	inactive: "bg-red-100 text-red-800 ",

	warning: "bg-yellow-100 text-yellow-800",

	disable: "bg-gray-100 text-gray-80",

	primary: "bg-blue-100 text-blue-800 ",

	outline: "bg-orange-50 ring-orange-200 text-orange-300",
};

export const resolveVariantStyle = ({
	variant,
}: {
	variant?: string;
}): string => {
	if (!variant) return "bg-orange-50 ring-orange-200 text-orange-300";
	return (
		VARIANT_STYLE_MAP[variant] ?? "bg-orange-50 ring-orange-200 text-orange-300"
	);
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
