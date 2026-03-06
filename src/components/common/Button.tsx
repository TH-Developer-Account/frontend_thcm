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
	isTooltip?: string;
	iconSize?: string;
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
	isTooltip,
	iconSize,
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
		<div className="relative inline-flex group">
			<button
				type={type}
				onClick={onClick}
				disabled={disabled}
				className={`
				${fullWidth ? "w-full" : "w-auto"}
				
				${base} ${[variant]} ${S[size]} ${className}${styleClass}`}
			>
				{Icon && iconPosition === "left" && (
					<Icon size={iconSize ? iconSize : 16} color={iconColor} />
				)}
				{text}
				{Icon && iconPosition === "right" && (
					<Icon size={iconSize ? iconSize : 16} color={iconColor} />
				)}
				{children ? children : null}
			</button>
			{/* Tooltip */}
			{isTooltip ? (
				<div
					className="
						absolute bottom-full left-1/2 -translate-x-1/2 mb-2
						whitespace-nowrap
						rounded-md bg-gray-900 text-white text-xs
						px-2 py-1 shadow-lg
						opacity-0 scale-95
						pointer-events-none
						transition-all duration-150
						group-hover:opacity-100
						group-hover:scale-100
						group-focus-within:opacity-100
						group-focus-within:scale-100
						z-50"
				>
					{isTooltip}
				</div>
			) : null}
		</div>
	);
};

export default Button;
