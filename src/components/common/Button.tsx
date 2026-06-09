import React from "react";
import { resolveStatusStyle, resolveVariantStyle } from "../styles.constant";
import type { ButtonProps } from "./common.types";
import { useNavigate } from "react-router-dom";
import HelperTooltip from "./HelperTooltip";

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

	const handleAction = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled) return;

		if (onClick) {
			onClick(e);
			return;
		}

		if (path) {
			navigate(path);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (disabled) return;

		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			e.currentTarget.click();
		}
	};

	return (
		<div
			className={`${fullWidth ? "w-full" : "w-auto"} relative inline-flex items-center group shrink-0`}
		>
			<button
				type={type}
				onClick={handleAction}
				onKeyDown={handleKeyDown}
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
					<Icon size={iconSize ?? 16} color={iconColor} />
				)}

				{text}

				{Icon && iconPosition === "right" && (
					<Icon size={iconSize ?? 16} color={iconColor} />
				)}

				{children ?? null}
			</button>

			{isTooltip ? (
				<span className="btn-tooltip" role="tooltip">
					{isTooltip}
				</span>
			) : null}
		</div>
	);
};

export default Button;
