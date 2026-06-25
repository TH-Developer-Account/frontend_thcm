import React from "react";
import Select from "react-select";
import type {
	SingleValue,
	FormatOptionLabelMeta,
	StylesConfig,
} from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { ServerAxios } from "../../services/ServerAxios";
import { useDebounce } from "../../hooks/useDebounce";
import HelperTooltip from "../common/HelperTooltip";

export type PincodeOption = {
	value: string;
	label: string;
	pincode: string;
	officeName: string;
	district: string;
	stateName: string;
	latitude: number | null;
	longitude: number | null;
};

type Props = {
	value?: PincodeOption | null;
	onChange: (option: PincodeOption | null) => void;
	placeholder?: string;
	isClearable?: boolean;
	error?: string;
	label?: string;
	required?: boolean;
	helperText?: string;
	isTooltip?: boolean;
	name?: string;
	isDisabled?: boolean;
	className?: string;
};

const PincodeAsyncSelect: React.FC<Props> = ({
	value,
	onChange,
	error,
	placeholder = "Search...",
	isClearable = true,
	label,
	required,
	helperText,
	isTooltip = true,
	name,
	isDisabled,
	className = "",
}) => {
	const [inputValue, setInputValue] = React.useState("");
	const [options, setOptions] = React.useState<PincodeOption[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);

	const debouncedInput = useDebounce(inputValue, 400);
	const errorId = name ? `${name}-error` : undefined;

	const customStyles: StylesConfig<PincodeOption, false> = {
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

		menu: (base) => ({
			...base,
			zIndex: 9999,
		}),

		option: (base) => ({
			...base,
			fontSize: "12px",
		}),
	};

	React.useEffect(() => {
		const fetchPincodes = async () => {
			if (debouncedInput.length < 2) {
				setOptions([]);
				return;
			}

			setIsLoading(true);

			try {
				const { data } = await ServerAxios.get(
					`/pincodes/search?q=${encodeURIComponent(debouncedInput)}&limit=10`,
				);

				const formatted: PincodeOption[] = (data.data ?? []).map(
					(item: any) => ({
						value: item.id,
						label: item.label,
						pincode: item.pincode,
						officeName: item.officeName,
						district: item.district,
						stateName: item.stateName,
						latitude: item.latitude,
						longitude: item.longitude,
					}),
				);

				setOptions(formatted);
			} catch (err) {
				console.error("Pincode search failed:", err);
				setOptions([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPincodes();
	}, [debouncedInput]);

	const formatOptionLabel = (
		option: PincodeOption,
		meta: FormatOptionLabelMeta<PincodeOption>,
	) => {
		if (meta.context === "value") {
			return <span>{option.label}</span>;
		}

		return (
			<div>
				<div className="font-medium">{option.officeName}</div>
				<div className="text-[11px] text-gray-500">
					{[option.district, option.stateName, option.pincode]
						.filter(Boolean)
						.join(" · ")}
				</div>
			</div>
		);
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
				<Select<PincodeOption>
					inputId={name}
					name={name}
					inputValue={inputValue}
					onInputChange={(val, { action }) => {
						if (action === "input-change") {
							setInputValue(val);
						}
					}}
					value={value ?? null}
					options={options}
					isLoading={isLoading}
					onChange={(selected: SingleValue<PincodeOption>) => {
						onChange(selected ?? null);
						setInputValue("");
						setOptions([]);
					}}
					isClearable={isClearable}
					isDisabled={isDisabled}
					placeholder={placeholder}
					filterOption={null}
					noOptionsMessage={({ inputValue: q }) =>
						q.length < 2 ? "Type at least 2 characters" : "No results found"
					}
					classNamePrefix="react-select"
					menuPortalTarget={
						typeof window !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					styles={customStyles}
					formatOptionLabel={formatOptionLabel}
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
};

export default PincodeAsyncSelect;
