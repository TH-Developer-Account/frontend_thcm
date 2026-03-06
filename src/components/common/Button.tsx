import React from "react";
import { resolveStatusStyle } from "../styles.constant";
import type { ButtonProps } from "./common.types";

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
	const S = {
		sm: "btn-sm",
		md: "btn-md",
		lg: "btn-lg",
		xl: "btn-xl",
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
					btn btn-${variant}
					${S[size]}
					${className}
					${styleClass}
				`}
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
			{isTooltip ? <div className="btn-tooltip">{isTooltip}</div> : null}
		</div>
	);
};

export default Button;
