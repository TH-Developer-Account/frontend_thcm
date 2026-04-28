import React from "react";
import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { ButtonProps } from "./common.types";
import { useNavigate } from "react-router-dom";

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
	path,
}) => {
	const navigate = useNavigate();
	const S = {
		sm: "btn-sm",
		md: "btn-md",
		lg: "btn-lg",
		xl: "btn-xl",
	};

	const styleClass = resolveStatusStyle({ status: status || "" });
	const variantClass = resolveVariantStyle({ variant: variant || "" });
	const handlePathClick = () => {
		if (path) navigate(path);
	};
	return (
		<div
			className={` ${fullWidth ? "w-full" : "w-auto"} relative inline-flex group`}
		>
			<button
				type={type}
				onClick={onClick || handlePathClick}
				disabled={disabled}
				className={`
					${fullWidth ? "w-full" : "w-auto"}
					btn
					${S[size]}
					${className}
					${styleClass || variantClass}
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
