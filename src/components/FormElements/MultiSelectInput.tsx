import Select from "react-select";
import type { Props, GroupBase } from "react-select";
import type { Option } from "./input.types";

interface MultiSelectProps extends Props<Option, true, GroupBase<Option>> {
	label?: string;
	error?: string;
	maxMenuHeight?: number;
}

export default function MultiSelectInput({
	label,
	error,
	className,
	maxMenuHeight = 200,
	...props
}: MultiSelectProps) {
	return (
		<div className="w-full">
			{label && (
				<label className="mb-1 block text-sm font-medium text-gray-700">
					{label}
				</label>
			)}

			<Select<Option, true>
				{...props}
				isMulti
				closeMenuOnSelect={false}
				maxMenuHeight={maxMenuHeight}
				className={`react-select-container ${className ?? ""}`}
				classNamePrefix="react-select"
				styles={{
					control: (base, state) => ({
						...base,
						minHeight: "44px",
						borderRadius: "0.5rem",
						borderColor: error
							? "#ef4444"
							: state.isFocused
								? "#3b82f6"
								: "#d1d5db",
						boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
						"&:hover": {
							borderColor: "#3b82f6",
						},
					}),
					valueContainer: (base) => ({
						...base,
						padding: "2px 8px",
						maxHeight: "96px",
						overflowY: "auto", // mobile scroll
					}),
					multiValue: (base) => ({
						...base,
						backgroundColor: "#e0e7ff",
						borderRadius: "0.375rem",
					}),
					multiValueLabel: (base) => ({
						...base,
						color: "#1e3a8a",
						fontSize: "0.875rem",
					}),
					multiValueRemove: (base) => ({
						...base,
						color: "#1e3a8a",
						":hover": {
							backgroundColor: "#3b82f6",
							color: "white",
						},
					}),
					menu: (base) => ({
						...base,
						borderRadius: "0.5rem",
						zIndex: 50,
					}),
				}}
			/>

			{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
		</div>
	);
}
