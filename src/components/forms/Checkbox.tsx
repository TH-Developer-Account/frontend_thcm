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

const MUTED_COLOR = "var(--color-border-muted, #c7c7c7)";

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
	const generatedId = React.useId();
	const checkboxId = name || `checkbox-${generatedId}`;
	const errorId = `${checkboxId}-error`;
	const hasError = Boolean(error);
	const isSelected = checked || indeterminate;

	const toggleChecked = () => {
		if (!disabled) {
			onChange?.(!checked);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			toggleChecked();
		}
	};

	const borderColor = hasError
		? "var(--color-error)"
		: isSelected
			? color
			: disabled
				? MUTED_COLOR
				: undefined;

	const backgroundColor = hasError
		? "var(--color-error-bg)"
		: checked
			? color
			: indeterminate
				? `${color}22`
				: undefined;

	const iconColor = hasError ? "var(--color-error)" : checked ? "#fff" : color;
	return (
		<div
			className={[
				"form-field",
				"checkbox-field",
				disabled ? "is-disabled" : "",
				hasError ? "has-error" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="checkbox-field-row">
				<div
					id={checkboxId}
					role="checkbox"
					tabIndex={disabled ? -1 : 0}
					aria-checked={indeterminate ? "mixed" : checked}
					aria-disabled={disabled}
					aria-invalid={hasError}
					aria-describedby={hasError ? errorId : undefined}
					onClick={toggleChecked}
					onKeyDown={handleKeyDown}
					className={[
						"checkbox",
						disabled ? "checkbox-disabled" : "checkbox-enabled",
						hasError ? "checkbox-error" : "",
						className,
					]
						.filter(Boolean)
						.join(" ")}
					style={{
						...style,
						width: size,
						height: size,
						borderRadius: 4,
						borderColor,
						backgroundColor,
						boxShadow:
							checked && !hasError && !disabled
								? `0 1px 6px ${color}44`
								: "none",
					}}
				>
					{checked ? (
						<span
							className="checkbox-icon"
							style={{
								color: iconColor,
								fontSize: size * 0.6,
							}}
						>
							✓
						</span>
					) : null}

					{!checked && indeterminate ? (
						<span
							className="checkbox-icon"
							style={{
								color: iconColor,
								fontSize: size * 0.65,
							}}
						>
							−
						</span>
					) : null}
				</div>

				{label ? (
					<div className="form-label-row">
						<label
							htmlFor={checkboxId}
							className="form-radio-label"
							onClick={toggleChecked}
						>
							{label}

							{required ? <span className="form-required"> *</span> : null}
						</label>

						{helperText && isTooltip && !hasError ? (
							<HelperTooltip label={label} text={helperText} />
						) : null}
					</div>
				) : null}
			</div>

			{error ? (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			) : null}
		</div>
	);
};

export default Checkbox;
