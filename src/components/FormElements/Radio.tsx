import React, { forwardRef, type InputHTMLAttributes } from "react";
import HelperTooltip from "../common/HelperToolTip";

interface InputProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"onChange"
> {
	groupLabel?: string;
	label1?: string;
	label2?: string;
	value1?: string;
	value2?: string;
	selectedValue?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
	onChange?: (value: string) => void;
}

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");

const Radio = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			groupLabel,
			label1,
			label2,
			value1 = "option1",
			value2 = "option2",
			selectedValue,
			name,
			required,
			className = "",
			disabled,
			helperText,
			error,
			isTooltip = true,
			onChange,
			...props
		},
		ref,
	) => {
		const errorId = name ? `${name}-error` : undefined;
		const helperId = name ? `${name}-helper` : undefined;
		const describedBy = error
			? errorId
			: helperText && !isTooltip
				? helperId
				: undefined;

		return (
			<div
				className={joinClassNames(
					"radio-group",
					disabled && "is-disabled",
					error && "has-error",
				)}
			>
				{groupLabel ? (
					<div className="form-label-row">
						<span className="form-label">
							{groupLabel}
							{required ? (
								<span className="form-required" aria-hidden="true">
									*
								</span>
							) : null}
						</span>
						{helperText && isTooltip && !error ? (
							<HelperTooltip label={groupLabel} text={helperText} />
						) : null}
					</div>
				) : null}

				<div
					className="radio-group-options"
					role="radiogroup"
					aria-label={groupLabel}
					aria-describedby={describedBy}
				>
					<label className="form-radio-field">
						<input
							ref={ref}
							id={`${name}-${value1}`}
							name={name}
							type="radio"
							disabled={disabled}
							required={required}
							checked={selectedValue === value1}
							value={value1}
							onChange={() => onChange?.(value1)}
							className={joinClassNames(
								"form-radio-input",
								error && "form-radio-input-error",
								className,
							)}
							aria-invalid={error ? "true" : undefined}
							{...props}
						/>
						{label1 ? <span className="form-radio-label">{label1}</span> : null}
					</label>

					<label className="form-radio-field">
						<input
							id={`${name}-${value2}`}
							name={name}
							type="radio"
							disabled={disabled}
							required={required}
							checked={selectedValue === value2}
							value={value2}
							onChange={() => onChange?.(value2)}
							className={joinClassNames(
								"form-radio-input",
								error && "form-radio-input-error",
								className,
							)}
							aria-invalid={error ? "true" : undefined}
							{...props}
						/>
						{label2 ? <span className="form-radio-label">{label2}</span> : null}
					</label>
				</div>

				{error ? (
					<p id={errorId} className="form-error-text" role="alert">
						{error}
					</p>
				) : helperText && !isTooltip ? (
					<p id={helperId} className="form-helper-text">
						{helperText}
					</p>
				) : null}
			</div>
		);
	},
);

Radio.displayName = "Radio";
export default Radio;
