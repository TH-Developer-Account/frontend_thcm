import React from "react";
import type { CheckboxProps } from "./input.types";

const Checkbox: React.FC<CheckboxProps> = ({
	checked = false,
	indeterminate = false,
	disabled = false,
	size = 18,
	color = "#2563eb",
	className = "",
	style = {},
	onChange,
}) => {
	const handleClick = () => {
		if (disabled) return;
		onChange?.(!checked);
	};

	return (
		<div
			role="checkbox"
			aria-checked={indeterminate ? "mixed" : checked}
			onClick={handleClick}
			className={`
				checkbox
				${disabled ? "checkbox-disabled" : "checkbox-enabled"}
				${className}
			`}
			style={{
				width: size,
				height: size,
				borderRadius: 4,
				border: `1.5px solid ${checked || indeterminate ? color : "#d1d5db"}`,
				background: checked ? color : indeterminate ? color + "22" : "#fff",
				boxShadow: checked ? `0 1px 6px ${color}44` : "none",
				...style,
			}}
		>
			{checked && (
				<span
					className="checkbox-icon"
					style={{
						color: "#fff",
						fontSize: size * 0.6,
					}}
				>
					✓
				</span>
			)}

			{!checked && indeterminate && (
				<span
					className="checkbox-icon"
					style={{
						color,
						fontSize: size * 0.65,
					}}
				>
					−
				</span>
			)}
		</div>
	);
};

export default Checkbox;
