import React from "react";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
	ButtonAppearance,
	ButtonProps,
	ButtonSize,
	ButtonVariant,
} from "./common.types";

const APPEARANCE_CLASS_MAP: Record<ButtonAppearance, string> = {
	/*
	 * Kept for backward compatibility.
	 * Industrial geometry is now controlled only by variant="iron".
	 */
	cta: "button-standard",
	standard: "button-standard",
	filter: "button-filter",
	toggle: "button-toggle",
	segmented: "button-segmented",
	icon: "button-icon",
	ghost: "button-ghost",
	switch: "button-switch",
	transparent: "button-transparent",
};

const VARIANT_CLASS_MAP: Record<ButtonVariant, string> = {
	brand: "button-brand",
	iron: "button-iron",
	outline: "button-outline",
	secondary: "button-secondary",
	danger: "button-danger",
	success: "button-success",
	warning: "button-warning",
	transparent: "button-transparent",
};

const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
	sm: "button-sm",
	md: "button-md",
	lg: "button-lg",
	xl: "button-xl",
};

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const Button: React.FC<ButtonProps> = ({
	text,
	children,

	type = "button",
	appearance = "standard",
	variant = "secondary",
	size = "md",

	active = false,
	loading = false,
	disabled = false,
	fullWidth = false,

	Icon,
	iconPosition = "left",
	iconSize,
	iconColor,

	path,
	isTooltip,
	to,
	direction,
	delta,

	className = "",
	onClick,
	"aria-label": ariaLabel,

	...nativeButtonProps
}) => {
	const navigate = useNavigate();
	const isNavigationButton =
		typeof delta === "number" ||
		!!to ||
		direction === "back" ||
		direction === "forward";

	const LeftIcon = isNavigationButton ? ArrowLeft : Icon;
	const RightIcon = isNavigationButton ? ArrowRight : Icon;
	const appearanceClass = APPEARANCE_CLASS_MAP[appearance] ?? "button-standard";

	const variantClass = VARIANT_CLASS_MAP[variant] ?? "button-secondary";

	const sizeClass = SIZE_CLASS_MAP[size] ?? "button-md";

	const isDisabled = disabled || loading;
	const isIconOnly = appearance === "icon";
	const isIron = variant === "iron";

	const resolvedIconSize =
		iconSize ?? (size === "sm" ? 14 : size === "xl" ? 20 : 16);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (isDisabled) return;

		onClick?.(event);

		if (event.defaultPrevented) return;

		if (path) {
			navigate(path);
		}
		if (typeof delta === "number") {
			navigate(delta);
			return;
		}

		if (to) {
			navigate(to);
			return;
		}

		if (direction === "forward") {
			navigate(1);
			return;
		}

		if (direction === "back") {
			navigate(-1);
		}
	};

	const content = children ?? text;

	const supportsPressedState =
		appearance === "toggle" ||
		appearance === "filter" ||
		appearance === "switch" ||
		appearance === "segmented";

	const iconStyle = iconColor ? { color: iconColor } : undefined;

	return (
		<span
			className={joinClassNames(
				"button-wrapper",
				fullWidth && "button-wrapper-full",
				appearance === "segmented" && "button-wrapper-segmented",
			)}
		>
			<button
				{...nativeButtonProps}
				type={type}
				disabled={isDisabled}
				aria-label={ariaLabel}
				aria-busy={loading || undefined}
				aria-pressed={
					supportsPressedState ? active : nativeButtonProps["aria-pressed"]
				}
				data-active={active ? "true" : "false"}
				data-loading={loading ? "true" : "false"}
				data-variant={variant}
				onClick={handleClick}
				className={joinClassNames(
					"button-base",
					appearanceClass,
					variantClass,
					sizeClass,
					isIron && "button-industrial",
					active && "is-active",
					fullWidth && "button-full-width",
					isIconOnly && "button-icon-only",
					className,
				)}
			>
				{loading ? (
					<LoaderCircle
						aria-hidden="true"
						className="button-loader"
						size={resolvedIconSize}
					/>
				) : Icon && iconPosition === "left" ? (
					<Icon
						aria-hidden="true"
						className="button-leading-icon"
						size={resolvedIconSize}
						style={iconStyle}
					/>
				) : null}
				{direction === "back" && LeftIcon && <LeftIcon size="16" />}
				{content != null ? (
					<span className="button-label">{content}</span>
				) : null}

				{!loading && Icon && iconPosition === "right" ? (
					<Icon
						aria-hidden="true"
						className="button-trailing-icon"
						size={resolvedIconSize}
						style={iconStyle}
					/>
				) : null}
				{direction === "forward" && RightIcon && <RightIcon size="16" />}
			</button>

			{isTooltip ? (
				<span className="button-tooltip" role="tooltip">
					{isTooltip}
				</span>
			) : null}
		</span>
	);
};

export default Button;
