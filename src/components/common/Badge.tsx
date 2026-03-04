import React from "react";
import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { GeneralStatus } from "./common.types";

interface BadgeProps {
	children?: React.ReactNode;
	status?: GeneralStatus;
	variant?: "primary" | "success" | "warning" | "danger" | "disable";
}

export function Badge({ children, status }: BadgeProps) {
	const styleClass =
		resolveStatusStyle({ status: status || "" }) || resolveVariantStyle;

	return (
		<span
			className={`inline-flex items-center  rounded-full px-2 py-0.5 text-xs font-medium ${styleClass}`}
		>
			{children || status}
		</span>
	);
}
