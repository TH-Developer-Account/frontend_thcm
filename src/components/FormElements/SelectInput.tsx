import { useId } from "react";
import Select from "react-select";
import type { GroupBase, Props } from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";

export interface BaseOption {
	label: string;
	value: string;
}

interface SelectInputProps<T extends BaseOption> extends Props<
	T,
	false,
	GroupBase<T>
> {
	label?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
	required?: boolean;
}

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

export default function SelectInput<T extends BaseOption>({
	label,
	error,
	helperText,
	isTooltip = true,
	required = false,

	id,
	inputId,
	name,
	className = "",
	isDisabled = false,

	menuPortalTarget,
	menuPosition = "fixed",
	menuPlacement = "auto",

	...selectProps
}: SelectInputProps<T>) {
	const generatedId = useId();

	const resolvedInputId =
		inputId ?? id ?? name ?? `select-input-${generatedId}`;

	const errorId = `${resolvedInputId}-error`;
	const helperId = `${resolvedInputId}-helper`;

	const describedBy = [
		error ? errorId : undefined,
		helperText && !isTooltip ? helperId : undefined,
	]
		.filter(Boolean)
		.join(" ");

	const resolvedPortalTarget =
		menuPortalTarget !== undefined
			? menuPortalTarget
			: typeof document !== "undefined"
				? document.body
				: undefined;

	return (
		<div
			className={joinClassNames(
				"form-field",
				"select-field",
				error && "has-error",
				isDisabled && "is-disabled",
			)}
		>
			{label ? (
				<div className="form-label-row">
					<label htmlFor={resolvedInputId} className="form-label">
						{label}

						{required ? (
							<span className="form-required" aria-hidden="true">
								*
							</span>
						) : null}
					</label>

					{helperText && isTooltip && !error ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div className="form-input-wrapper">
				<Select<T, false, GroupBase<T>>
					{...selectProps}
					id={id}
					inputId={resolvedInputId}
					name={name}
					required={required}
					isDisabled={isDisabled}
					unstyled
					classNamePrefix="react-select"
					className={joinClassNames(
						"react-select-container",
						error && "react-select-container-error",
						isDisabled && "react-select-container-disabled",
						className,
					)}
					menuPortalTarget={resolvedPortalTarget}
					menuPosition={menuPosition}
					menuPlacement={menuPlacement}
					aria-invalid={error ? "true" : undefined}
					aria-required={required || undefined}
					aria-describedby={describedBy || undefined}
					aria-errormessage={error ? errorId : undefined}
				/>

				{error ? (
					<ExclamationCircleIcon
						aria-hidden="true"
						className="form-error-icon select-error-icon"
					/>
				) : null}
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
}
