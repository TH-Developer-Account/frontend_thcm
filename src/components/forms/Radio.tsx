import { forwardRef, type InputHTMLAttributes } from "react";
import HelperTooltip from "../common/HelperTooltip";

export type RadioOption = {
	label: string;
	value: string;
	disabled?: boolean;
};

interface InputProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"onChange" | "value"
> {
	groupLabel?: string;

	/**
	 * Preferred API for new usage.
	 */
	options?: RadioOption[];

	/**
	 * Backward-compatible API.
	 */
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

const slugify = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const getResolvedOptions = ({
	options,
	label1,
	label2,
	value1 = "option1",
	value2 = "option2",
}: Pick<InputProps, "options" | "label1" | "label2" | "value1" | "value2">) => {
	if (options?.length) {
		return options;
	}

	return [
		label1 ? { label: label1, value: value1 } : null,
		label2 ? { label: label2, value: value2 } : null,
	].filter(Boolean) as RadioOption[];
};

const Radio = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			groupLabel,
			options,
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
		const resolvedOptions = getResolvedOptions({
			options,
			label1,
			label2,
			value1,
			value2,
		});

		const errorId = name ? `${name}-error` : undefined;
		const helperId = name ? `${name}-helper` : undefined;
		const groupId = name ? `${name}-group-label` : undefined;

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
						<span id={groupId} className="form-label">
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
					aria-labelledby={groupLabel ? groupId : undefined}
					aria-label={!groupLabel ? name : undefined}
					aria-describedby={describedBy}
				>
					{resolvedOptions.map((option, index) => {
						const optionId = `${name || "radio"}-${slugify(option.value)}`;
						const isOptionDisabled = disabled || option.disabled;

						return (
							<label
								key={option.value}
								htmlFor={optionId}
								className={joinClassNames(
									"form-radio-field",
									isOptionDisabled && "is-disabled",
								)}
							>
								<input
									{...props}
									ref={index === 0 ? ref : undefined}
									id={optionId}
									name={name}
									type="radio"
									disabled={isOptionDisabled}
									required={required}
									checked={selectedValue === option.value}
									value={option.value}
									onChange={() => onChange?.(option.value)}
									className={joinClassNames(
										"form-radio-input",
										error && "form-radio-input-error",
										className,
									)}
									aria-invalid={error ? "true" : undefined}
								/>

								<span className="form-radio-label">{option.label}</span>
							</label>
						);
					})}
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
