import Select from "react-select";
import type { Props, GroupBase, MultiValue, ActionMeta } from "react-select";
import type { Option } from "./input.types";

interface MultiSelectProps extends Props<Option, true, GroupBase<Option>> {
	label?: string;
	error?: string;
	maxMenuHeight?: number;
	name?: string;
	onValueChange?: (data: { fieldName?: string; value: Option[] }) => void;
	value: Option[];
}

export default function MultiSelectInput({
	label,
	error,
	className,
	maxMenuHeight = 200,
	...props
}: MultiSelectProps) {
	const handleChange = (
		selected: MultiValue<Option>,
		// _actionMeta: ActionMeta<Option>,
	) => {
		props.onValueChange?.({
			fieldName: props.name,
			value: selected as Option[],
		});
	};

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
				hideSelectedOptions={false}
				maxMenuHeight={maxMenuHeight}
				className={`react-select-container ${className ?? ""}`}
				classNamePrefix="react-select"
				onChange={handleChange}
				styles={{
					control: (base, state) => ({
						...base,
						minHeight: "44px",
						borderRadius: "10px",
						borderColor: error
							? "#ef4444"
							: state.isFocused
								? "#3b82f6"
								: "#d1d5db",
						boxShadow: state.isFocused
							? error
								? "0 0 0 1px #ef4444"
								: "0 0 0 1px #3b82f6"
							: "none",
						padding: "2px 6px",
						alignItems: "center",
						"&:hover": {
							borderColor: error ? "#ef4444" : "#3b82f6",
						},
					}),
					valueContainer: (base) => ({
						...base,
						padding: "0",
						gap: "6px",
						flexWrap: "nowrap",
						overflowX: "auto",
						overflowY: "hidden",
						scrollbarWidth: "thin",
					}),
					placeholder: (base) => ({
						...base,
						fontSize: "14px",
						color: "#9ca3af",
						marginLeft: "2px",
						whiteSpace: "nowrap",
					}),
					multiValue: (base) => ({
						...base,
						backgroundColor: "#e8eefc",
						borderRadius: "8px",
						maxWidth: "180px",
						minHeight: "30px",
						margin: 0,
					}),
					multiValueLabel: (base) => ({
						...base,
						color: "#3553a4",
						fontSize: "14px",
						padding: "4px 8px",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}),
					multiValueRemove: (base) => ({
						...base,
						color: "#3553a4",
						borderRadius: "0 8px 8px 0",
						paddingLeft: "4px",
						paddingRight: "6px",
						":hover": {
							backgroundColor: "#c7d2fe",
							color: "#1e3a8a",
						},
					}),
					clearIndicator: (base) => ({
						...base,
						padding: "4px",
						color: "#9ca3af",
						":hover": {
							color: "#6b7280",
						},
					}),
					dropdownIndicator: (base) => ({
						...base,
						padding: "4px",
						color: "#6b7280",
						":hover": {
							color: "#374151",
						},
					}),
					indicatorSeparator: () => ({
						display: "none",
					}),
					indicatorsContainer: (base) => ({
						...base,
						alignSelf: "stretch",
						paddingRight: "2px",
						gap: "2px",
					}),
					input: (base) => ({
						...base,
						margin: 0,
						padding: 0,
					}),
					menu: (base) => ({
						...base,
						borderRadius: "10px",
						overflow: "hidden",
						zIndex: 50,
					}),
					option: (base, state) => ({
						...base,
						fontSize: "14px",
						backgroundColor: state.isSelected
							? "#dbeafe"
							: state.isFocused
								? "#eff6ff"
								: "#fff",
						color: "#111827",
						cursor: "pointer",
					}),
				}}
			/>

			{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
		</div>
	);
}
