import React from "react";
import type { LucideIcon } from "lucide-react";

type ButtonProps = {
	text: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	type?: "button" | "submit";
	disabled?: boolean;
	className?: string;
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	fullWidth?: boolean; // 👈 add this
};

const Button: React.FC<ButtonProps> = ({
	text,
	onClick,
	type = "button",
	disabled = false,
	className = "",
	Icon,
	iconPosition = "left",
	fullWidth = false,
}) => {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`
				${fullWidth ? "w-full" : "w-auto"}
				bg-[#f35a00] text-white px-4 py-2
				rounded-md font-semibold
				hover:opacity-90 disabled:opacity-50
				flex items-center justify-center gap-2
				${className}
			`}
		>
			{Icon && iconPosition === "left" && <Icon size={16} />}
			{text}
			{Icon && iconPosition === "right" && <Icon size={16} />}
		</button>
	);
};

export default Button;
