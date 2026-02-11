import React from "react";

/* 1️⃣ Status type */
export type Status = "Done" | "In process" | "Pending";

/* 2️⃣ Status → styles map */
const statusStyles: Record<Status, string> = {
	Done: "bg-green-300 text-green-700",
	"In process": "bg-blue-300 text-blue-700",
	Pending: "bg-yellow-300 text-yellow-700",
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
