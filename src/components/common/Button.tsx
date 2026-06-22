import React from "react";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
	ButtonAppearance,
	ButtonProps,
	ButtonSize,
	ButtonVariant,
} from "./common.types";

const APPEARANCE_CLASS_MAP: Record<ButtonAppearance, string> = {
	cta: "button-cta",
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

	className = "",
	onClick,
	"aria-label": ariaLabel,

	...nativeButtonProps
}) => {
	const navigate = useNavigate();

	const appearanceClass = APPEARANCE_CLASS_MAP[appearance] ?? "button-standard";

	const variantClass = VARIANT_CLASS_MAP[variant] ?? "button-secondary";

	const sizeClass = SIZE_CLASS_MAP[size] ?? "button-md";

	const isDisabled = disabled || loading;
	const isIconOnly = appearance === "icon";

	const resolvedIconSize =
		iconSize ?? (size === "sm" ? 14 : size === "xl" ? 20 : 16);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (isDisabled) return;

		onClick?.(event);

		if (event.defaultPrevented) return;

		if (path) {
			navigate(path);
		}
	};

	const content = children ?? text;

	const supportsPressedState =
		appearance === "toggle" ||
		appearance === "filter" ||
		appearance === "switch" ||
		appearance === "segmented";

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
				onClick={handleClick}
				className={joinClassNames(
					"button-base",
					appearanceClass,
					variantClass,
					sizeClass,
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
						color={iconColor}
					/>
				) : null}

				{content != null ? (
					<span className="button-label">{content}</span>
				) : null}

				{!loading && Icon && iconPosition === "right" ? (
					<Icon
						aria-hidden="true"
						className="button-trailing-icon"
						size={resolvedIconSize}
						color={iconColor}
					/>
				) : null}
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
