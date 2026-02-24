import React from "react";
import { resolveStatusStyle } from "../styles.constant";
import type { GeneralStatus } from "./common.types";

interface BadgeProps {
	children?: React.ReactNode;
	status?: GeneralStatus;
	variant?: "primary" | "success" | "warning" | "danger" | "disable";
}

export function Badge({ children, status, variant = "primary" }: BadgeProps) {
	const styleClass = resolveStatusStyle({ status: status || "" });

	return (
		<span
			className={`inline-flex items-center  rounded-full px-2 py-0.5 text-xs font-medium ${styleClass} ${variant}`}
		>
			{children || status}
		</span>
	);
}
