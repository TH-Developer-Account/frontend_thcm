import React from "react";
import HelperTooltip from "../common/HelperTooltip";

type CheckboxProps = {
	name?: string;
	label?: string;
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	required?: boolean;
	size?: number;
	color?: string;
	className?: string;
	style?: React.CSSProperties;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
	onChange?: (checked: boolean) => void;
};

const Checkbox: React.FC<CheckboxProps> = ({
	name,
	label,
	checked = false,
	indeterminate = false,
	disabled = false,
	required = false,
	size = 18,
	color = "#f35a00",
	className = "",
	style = {},
	error,
	helperText,
	isTooltip = true,
	onChange,
}) => {
	const errorId = name ? `${name}-error` : undefined;

	const handleClick = () => {
		if (disabled) return;
		onChange?.(!checked);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onChange?.(!checked);
		}
	};

	return (
		<div className="form-field">
			<div className="checkbox-field-row">
				<div
					role="checkbox"
					tabIndex={disabled ? -1 : 0}
					aria-checked={indeterminate ? "mixed" : checked}
					aria-invalid={!!error}
					aria-describedby={error ? errorId : undefined}
					onClick={handleClick}
					onKeyDown={handleKeyDown}
					className={`
						checkbox
						${disabled ? "checkbox-disabled" : "checkbox-enabled"}
						${className}
					`}
					style={{
						width: size,
						height: size,
						borderRadius: 4,
						border: `1.5px solid ${
							checked || indeterminate ? color : "#d1d5db"
						}`,
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

				{label && (
					<div className="form-label-row">
						<label className="form-radio-label">
							{label}
							{required && <span className="form-required"> *</span>}
						</label>

						{helperText && isTooltip && !error && (
							<HelperTooltip label={label} text={helperText} />
						)}
					</div>
				)}
			</div>

			{error && (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
};

export default Checkbox;
