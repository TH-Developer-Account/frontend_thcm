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
	...props
}: SelectInputProps) {
	return (
		<div className="w-full">
			{label && (
				<label className="mb-1 block text-sm font-medium text-gray-700">
					{label}
				</label>
			)}
			<Select
				{...props}
				className={`react-select-container ${className ?? ""}`}
				classNamePrefix="react-select"
				menuPortalTarget={
					typeof window !== "undefined" ? document.body : undefined
				}
				menuPosition="fixed"
				menuPlacement="auto"
				styles={{
					control: (base, state) => ({
						...base,
						minHeight: "44px",
						borderRadius: "0.75rem",
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
					menu: (base) => ({
						...base,
						borderRadius: "0.75rem",
					}),
					menuPortal: (base) => ({
						...base,
						zIndex: 9999,
					}),
					option: (base, state) => ({
						...base,
						backgroundColor: state.isSelected
							? "#f97316"
							: state.isFocused
								? "#fff7ed"
								: "white",
						color: state.isSelected ? "white" : "#111827",
						cursor: "pointer",
					}),
				}}
			/>

			{error && (
				<p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
			)}
		</div>
	);
}
