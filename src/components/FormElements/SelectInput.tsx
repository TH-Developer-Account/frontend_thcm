import Select from "react-select";
import type { Props, GroupBase } from "react-select";

export interface Option {
	label: string;
	value: string;
}

interface SelectInputProps extends Props<Option, false, GroupBase<Option>> {
	label?: string;
	error?: string;
	required?: boolean;
}

export default function SelectInput({
	label,
	error,
	required,
	className,
	isDisabled,
	...props
}: SelectInputProps) {
	return (
		<div className="form-field">
			{label && (
				<label className="form-label">
					{label}
					{required && <span className="form-required"> *</span>}
				</label>
			)}

			<div className="form-input-wrapper relative">
				<Select
					{...props}
					value={props.value}
					onChange={props.onChange}
					isDisabled={isDisabled}
					classNamePrefix="react-select"
					menuPortalTarget={
						typeof window !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					styles={{
						menuPortal: (base) => ({
							...base,
							zIndex: 9999,
						}),
					}}
					className={`form-select-wrap ${className} ${error ? "form-input-error" : ""}`}
				/>
			</div>

			{error && <p className="mt-1 text-xs text-red-600 text-left">{error}</p>}
		</div>
	);
}
