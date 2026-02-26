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
	if (!status) return "bg-zinc-100 text-zinc-800";
	return STATUS_STYLE_MAP[status] ?? "bg-zinc-100 text-zinc-800";
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
		default:
			return "bg-blue-100 text-blue-800";
	}
};
