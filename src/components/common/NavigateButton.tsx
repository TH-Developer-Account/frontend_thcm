import React from "react";
import type { NavigateButtonProps } from "./common.types";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const NavigateButton: React.FC<NavigateButtonProps> = ({
	text,
	Icon,
	iconSize = 16,
	iconPosition = "left",
	to,
	direction,
	delta,
	onClick,
	className = "",
}) => {
	const navigate = useNavigate();

	const isNavigationButton =
		typeof delta === "number" ||
		!!to ||
		direction === "back" ||
		direction === "forward";

	const LeftIcon = isNavigationButton ? ArrowLeft : Icon;
	const RightIcon = isNavigationButton ? ArrowRight : Icon;

	const handleClick = () => {
		if (onClick) {
			onClick();
			return;
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

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`workflow-create-badge ${className}`}
		>
			{iconPosition === "left" && LeftIcon && <LeftIcon size={iconSize} />}

			{text && <span>{text}</span>}

			{iconPosition === "right" && RightIcon && <RightIcon size={iconSize} />}
		</button>
	);
};

export default NavigateButton;
