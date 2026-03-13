import Select from "react-select";
import type { Props, GroupBase } from "react-select";

export interface Option {
	label: string;
	value: string;
}

interface SelectInputProps extends Props<Option, false, GroupBase<Option>> {
	label?: string;
	error?: string;
}

export default function SelectInput({
	label,
	error,
	className,
	isDisabled,
	...props
}: SelectInputProps) {
	return (
		<div className="mb-4 w-full">
			{label && (
				<label className="text-left block text-sm/6 font-medium text-gray-900">
					{label}
				</label>
			)}

			<div className="mt-2">
				<Select
					{...props}
					value={props.value}
					onChange={props.onChange}
					isDisabled={isDisabled}
					classNamePrefix="react-select "
					menuPortalTarget={
						typeof window !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					styles={{
						control: (base, state) => ({
							...base,
							minHeight: "31px",
							borderRadius: "0.375rem", // rounded-md
							paddingLeft: "0.25rem",
							paddingRight: "0.25rem",
							backgroundColor: isDisabled ? "#f9fafb" : "white",
							borderWidth: "1px",
							borderStyle: "solid",
							borderColor: error
								? "#ef4444"
								: state.isFocused
									? "#f97316" // your brand orange
									: "#d1d5db",
							boxShadow: state.isFocused ? "0 0 0 1px #f97316" : "none",
							"&:hover": {
								borderColor: "#f97316",
							},
						}),
						valueContainer: (base) => ({
							...base,
							padding: "0 0.5rem", // match px-3
						}),
						input: (base) => ({
							...base,
							margin: 0,
							padding: 0,
						}),
						placeholder: (base) => ({
							...base,
							color: "#9ca3af",
						}),
						singleValue: (base) => ({
							...base,
							color: "#111827",
						}),
						menu: (base) => ({
							...base,
							borderRadius: "0.375rem",
							zIndex: 9999,
						}),
						option: (base, state) => ({
							...base,
							backgroundColor: state.isSelected
								? "#FFEDD5" // orange-100
								: state.isFocused
									? "#FFEDD5" // orange-100 on hover
									: "white",
							color:
								state.isSelected || state.isFocused
									? "#EA580C" // orange-600
									: "#111827", // default gray-900
							cursor: "pointer",
						}),
						menuPortal: (base) => ({
							...base,
							zIndex: 9999,
						}),
					}}
					className={`${className ?? ""} ${
						isDisabled ? "opacity-60 cursor-not-allowed" : ""
					}`}
				/>
			</div>

			{error && <p className="mt-1 text-xs text-red-600 text-left">{error}</p>}
		</div>
	);
}
