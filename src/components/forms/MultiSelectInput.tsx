import { useId } from "react";
import Select from "react-select";
import type { Props, GroupBase, MultiValue } from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import type { Option } from "./input.types";

interface MultiSelectProps extends Props<Option, true, GroupBase<Option>> {
	label?: string;
	error?: string;
	maxMenuHeight?: number;
	name?: string;
	onValueChange?: (data: { fieldName?: string; value: Option[] }) => void;
	value: Option[];
}

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");

export default function MultiSelectInput({
	label,
	error,
	className = "",
	maxMenuHeight = 200,
	name,
	inputId,
	isDisabled = false,
	required = false,
	...props
}: MultiSelectProps) {
	const generatedId = useId();
	const resolvedInputId = inputId ?? name ?? `multi-select-${generatedId}`;
	const errorId = `${resolvedInputId}-error`;

	const handleChange = (selected: MultiValue<Option>) => {
		props.onValueChange?.({ fieldName: name, value: selected as Option[] });
	};

	return (
		<div
			className={joinClassNames(
				"form-field select-field",
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
				</div>
			) : null}

			<div className="form-input-wrapper">
				<Select<Option, true>
					{...props}
					inputId={resolvedInputId}
					name={name}
					isMulti
					isDisabled={isDisabled}
					required={required}
					closeMenuOnSelect={false}
					hideSelectedOptions={false}
					maxMenuHeight={maxMenuHeight}
					unstyled
					classNamePrefix="react-select"
					className={joinClassNames(
						"react-select-container",
						error && "react-select-container-error",
						className,
					)}
					onChange={handleChange}
					menuPortalTarget={
						typeof document !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					aria-invalid={error ? "true" : undefined}
					aria-required={required || undefined}
					aria-describedby={error ? errorId : undefined}
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
			) : null}
		</div>
	);
}
