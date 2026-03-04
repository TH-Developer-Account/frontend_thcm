import React from "react";

interface CheckboxProps {
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	size?: number;
	color?: string;
	className?: string;
	style?: React.CSSProperties;
	onChange?: (checked: boolean) => void;
}

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
			className={className}
			style={{
				width: size,
				height: size,
				borderRadius: 4,
				flexShrink: 0,
				cursor: disabled ? "not-allowed" : "pointer",
				border: `1.5px solid ${checked || indeterminate ? color : "#d1d5db"}`,
				background: checked ? color : indeterminate ? color + "22" : "#fff",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				transition: "all 0.15s",
				boxShadow: checked ? `0 1px 6px ${color}44` : "none",
				opacity: disabled ? 0.6 : 1,
				...style,
			}}
		>
			{checked && (
				<span
					style={{
						color: "#fff",
						fontSize: size * 0.6,
						fontWeight: 700,
						lineHeight: 1,
					}}
				>
					✓
				</span>
			)}

			{!checked && indeterminate && (
				<span
					style={{
						color,
						fontSize: size * 0.65,
						fontWeight: 700,
						lineHeight: 1,
					}}
				>
					−
				</span>
			)}
		</div>
	);
};

export default Checkbox;
