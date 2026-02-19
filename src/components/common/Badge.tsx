import React from "react";

export type TableUserStatus = "Active" | "Blocked" | "Inactive";
export type EPCStatus =
	| "Approved"
	| "Recommended"
	| "Pending"
	| "Completed"
	| "Submitted"
	| "Sent Back"
	| "Report Submitted"
	| "Cancelled";

export type GeneralStatus = EPCStatus | TableUserStatus;

interface BadgeProps {
	children?: React.ReactNode;
	status?: GeneralStatus;
	variant?: "primary" | "success" | "warning" | "danger" | "disable";
}

export function Badge({ children, status, variant = "primary" }: BadgeProps) {
	const resolveStatusStyle = (): string => {
		switch (status) {
			// ✅ GREEN GROUP
			case "Active":
			case "Approved":
				return "bg-green-100 text-green-800";

			// ✅ BLUE GROUP
			case "Recommended":
				return "bg-blue-100 text-blue-800";

			case "Submitted":
				return "bg-purple-100 text-purple-800";

			case "Report Submitted":
				return "bg-orange-100 text-orange-800";

			// ✅ YELLOW GROUP
			case "Pending":
				return "bg-yellow-100 text-yellow-800";

			// ✅ RED GROUP
			case "Cancelled":
			case "Blocked":
				return "bg-red-100 text-red-800";

			// ✅ GRAY GROUP
			case "Sent Back":
			case "Inactive":
				return "bg-gray-300 text-gray-800";

			// ✅ EMERALD GROUP
			case "Completed":
				return "bg-emerald-100 text-emerald-800";

			default:
				return resolveVariantStyle();
		}
	};

	const resolveVariantStyle = (): string => {
		switch (variant) {
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

	const styleClass = resolveStatusStyle();

	return (
		<span
			className={`inline-flex items-center  rounded-full px-2 py-0.5 text-xs font-medium ${styleClass}`}
		>
			{children || status}
		</span>
	);
}
