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

	const inputRef = React.useRef<HTMLInputElement>(null);

	const hasError = Boolean(error);
	const isSelected = checked || indeterminate;

	React.useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = indeterminate;
		}
	}, [indeterminate]);

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
				<div className="relative shrink-0">
					<input
						ref={inputRef}
						id={checkboxId}
						name={name}
						type="checkbox"
						checked={checked}
						disabled={disabled}
						required={required}
						aria-invalid={hasError}
						aria-describedby={hasError ? errorId : undefined}
						onChange={(event) => onChange?.(event.target.checked)}
						className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
						style={{
							width: size,
							height: size,
						}}
					/>

					<span
						aria-hidden="true"
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
					</span>
				</div>

				{label ? (
					<div className="form-label-row">
						<label
							htmlFor={checkboxId}
							className="form-radio-label cursor-pointer"
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
