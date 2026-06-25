import Select from "react-select";
import type { Props, GroupBase, StylesConfig } from "react-select";
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
	required?: boolean;
	helperText?: string;
	isTooltip?: boolean;
}

export default function SelectInput<T extends BaseOption>({
	label,
	error,
	required,
	className = "",
	helperText,
	isDisabled,
	name,
	isTooltip = true,
	...props
}: SelectInputProps<T>) {
	const errorId = name ? `${name}-error` : undefined;

	const customStyles: StylesConfig<T, false> = {
		control: (base, state) => ({
			...base,
			minHeight: "30px",
			height: "30px",
			borderRadius: "12px",
			borderWidth: "1px",
			paddingRight: error ? "36px" : "8px",
			backgroundColor: isDisabled ? "var(--color-bg-disabled)" : "#ffffff",
			borderColor: error ? "#dc2626" : state.isFocused ? "#f35a00" : "#d1d5db",
			boxShadow: error
				? "0 0 0 1px #dc2626"
				: state.isFocused
					? "0 0 0 1px #f35a00"
					: "none",
			"&:hover": {
				borderColor: error ? "#dc2626" : "#f35a00",
			},
			scrollbarWidth: "thin",
		}),
		valueContainer: (base) => ({
			...base,
			height: "30px",
			padding: "0 8px",
			scrollbarWidth: "thin",
		}),
		input: (base) => ({
			...base,
			margin: 0,
			padding: 0,
		}),
		placeholder: (base) => ({
			...base,
			color: "#9ca3af",
			fontSize: "12px",
		}),
		singleValue: (base) => ({
			...base,
			fontSize: "12px",
		}),
		indicatorsContainer: (base) => ({
			...base,
			height: "30px",
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
				<div className="form-label-row">
					<label htmlFor={name} className="form-label">
						{label}
						{required && <span className="form-required"> *</span>}
					</label>

					{helperText && isTooltip && !error && (
						<HelperTooltip label={label} text={helperText} />
					)}
				</div>
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
					aria-describedby={error ? errorId : undefined}
					className={`${className} scrollbar-sleek`}
				/>

				{error && <ExclamationCircleIcon className="form-error-icon" />}
			</div>

			{error && (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
}
