import React from "react";

/* 1️⃣ Status type */
export type Status =
	| "Recommended"
	| "Pending"
	| "Sent Back"
	| "Report Submitted"
	| "Approved"
	| "Submitted"
	| "Cancelled"
	| "Completed";

/* 2️⃣ Status → styles map */
const statusStyles: Record<Status, string> = {
	Approved: "bg-green-100 text-green-800",
	Recommended: "bg-blue-100 text-blue-800",
	Pending: "bg-yellow-100 text-yellow-800",
	Completed: "bg-emerald-100 text-emerald-800",
	Submitted: "bg-sky-100 text-sky-800",
	"Sent Back": "bg-gray-100 text-gray-800",
	"Report Submitted": "bg-orange-100 text-orange-800",
	Cancelled: "bg-red-100 text-red-800",
};

/* 3️⃣ Props */
interface BadgeProps {
	children?: React.ReactNode;
	status?: Status;
	variant?: "primary" | "success" | "warning" | "danger" | "disable";
}

/* 4️⃣ Component */
export function Badge({ children, status, variant = "primary" }: BadgeProps) {
	const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
		primary: "bg-blue-300 text-blue-700",
		success: "bg-green-300 text-green-700",
		warning: "bg-yellow-300 text-yellow-700",
		danger: "bg-red-300 text-red-700",
		disable: "bg-gray-300 text-gray-700",
	};

	// ✅ status wins over variant
	const className = status ? statusStyles[status] : variantStyles[variant];

	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
		>
			{children ?? status}
		</span>
	);
}
