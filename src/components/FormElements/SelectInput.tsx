import Select from "react-select";
import type { Props, GroupBase, StylesConfig } from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export interface Option {
	label: string;
	value: string;
}

interface SelectInputProps extends Props<Option, false, GroupBase<Option>> {
	label?: string;
	error?: string;
	required?: boolean;
	helperText?: string;
}

export default function SelectInput({
	label,
	error,
	required,
	className = "",
	helperText,
	isDisabled,
	name,
	...props
}: SelectInputProps) {
	const customStyles: StylesConfig<Option, false> = {
		control: (base, state) => ({
			...base,
			minHeight: "44px",
			borderRadius: "12px",
			borderWidth: "1px",
			paddingRight: error ? "36px" : "8px",
			// 👇 MATCH YOUR FORM INPUT
			backgroundColor: isDisabled
				? "#f3f4f6"
				: state.isFocused
					? "#ffffff"
					: "#fafaf8",
			// backgroundColor: isDisabled ? "#f3f4f6" : "#fff",
			borderColor: error ? "#dc2626" : state.isFocused ? "#f35a00" : "#d1d5db",
			boxShadow: error
				? "0 0 0 1px #dc2626"
				: state.isFocused
					? "0 0 0 1px #f35a00"
					: "none",
			"&:hover": {
				borderColor: error ? "#dc2626" : "#f35a00",
			},
		}),
		valueContainer: (base) => ({
			...base,
			padding: "0 8px",
		}),
		placeholder: (base) => ({
			...base,
			color: "#9ca3af",
		}),
		indicatorSeparator: () => ({
			display: "none",
		}),
		menuPortal: (base) => ({
			...base,
			zIndex: 9999,
		}),
	};

	return (
		<div className="form-field">
			{label && (
				<label htmlFor={name} className="form-label">
					{label}
					{required && <span className="form-required"> *</span>}
				</label>
			)}

			<div className="form-input-wrapper relative">
				<Select
					{...props}
					inputId={name}
					name={name}
					isDisabled={isDisabled}
					classNamePrefix="react-select"
					menuPortalTarget={
						typeof window !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					styles={customStyles}
					aria-invalid={!!error}
					aria-describedby={error ? `${name}-error` : undefined}
					className={className}
				/>

				{error && <ExclamationCircleIcon className="form-error-icon" />}
			</div>

			{error && (
				<p id={`${name}-error`} className="form-error-text">
					{error}
				</p>
			)}

			{!error && helperText && <p className="form-helper-text">{helperText}</p>}
		</div>
	);
}
