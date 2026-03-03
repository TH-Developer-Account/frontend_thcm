import React from "react";
import type { LucideIcon } from "lucide-react";
import { resolveStatusStyle } from "../styles.constant";

type ButtonProps = {
	text?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	type?: "button" | "submit";
	disabled?: boolean;
	status?: string;
	className?: string;
	variant?: "brand" | "primary" | "success" | "warning" | "danger" | "disable";
	size?: "sm" | "md" | "lg";
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	iconColor?: string;
	fullWidth?: boolean; // 👈 add this
	children?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
	text,
	onClick,
	type = "button",
	disabled = false,
	variant = "brand",
	size = "md",
	status,
	className = "",
	Icon,
	iconPosition = "left",
	fullWidth = false,
	children,
	iconColor,
}) => {
	const base =
		"bg-[#f35a00] text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer";

	const S = {
		sm: "px-3 py-1.5 text-xs",
		md: "px-4 py-2 text-sm",
		lg: "px-6 py-2.5 text-sm",
		xl: "px-8 py-3 text-base",
	};
	const styleClass = resolveStatusStyle({ status: status || "" });
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`
				${fullWidth ? "w-full" : "w-auto"}
				
				${base} ${[variant]} ${S[size]} ${className}${styleClass}`}
		>
			{Icon && iconPosition === "left" && <Icon size={16} color={iconColor} />}
			{text}
			{Icon && iconPosition === "right" && <Icon size={16} color={iconColor} />}
			{children ? children : null}
		</button>
	);
};

export default Button;
