import React, { useId } from "react";
import Select from "react-select";
import type { SingleValue, FormatOptionLabelMeta } from "react-select";
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

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");

const PincodeAsyncSelect: React.FC<Props> = ({
	value,
	onChange,
	error,
	placeholder = "Search...",
	isClearable = true,
	label,
	required = false,
	helperText,
	isTooltip = true,
	name,
	isDisabled = false,
	className = "",
}) => {
	const generatedId = useId();
	const inputId = name ?? `pincode-select-${generatedId}`;
	const errorId = `${inputId}-error`;
	const helperId = `${inputId}-helper`;
	const [inputValue, setInputValue] = React.useState("");
	const [options, setOptions] = React.useState<PincodeOption[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const debouncedInput = useDebounce(inputValue, 400);

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
				setOptions(
					(data.data ?? []).map((item: any) => ({
						value: item.id,
						label: item.label,
						pincode: item.pincode,
						officeName: item.officeName,
						district: item.district,
						stateName: item.stateName,
						latitude: item.latitude,
						longitude: item.longitude,
					})),
				);
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
		if (meta.context === "value") return <span>{option.label}</span>;
		return (
			<div className="select-option-content">
				<div className="select-option-primary">{option.officeName}</div>
				<div className="select-option-secondary">
					{[option.district, option.stateName, option.pincode]
						.filter(Boolean)
						.join(" · ")}
				</div>
			</div>
		);
	};

	const describedBy = [
		error ? errorId : undefined,
		helperText && !isTooltip ? helperId : undefined,
	]
		.filter(Boolean)
		.join(" ");

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
					<label htmlFor={inputId} className="form-label">
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
				<Select<PincodeOption>
					inputId={inputId}
					name={name}
					inputValue={inputValue}
					onInputChange={(nextValue, { action }) => {
						if (action === "input-change") setInputValue(nextValue);
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
					noOptionsMessage={({ inputValue: query }) =>
						query.length < 2 ? "Type at least 2 characters" : "No results found"
					}
					unstyled
					classNamePrefix="react-select"
					className={joinClassNames(
						"react-select-container",
						error && "react-select-container-error",
						className,
					)}
					menuPortalTarget={
						typeof document !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					formatOptionLabel={formatOptionLabel}
					aria-invalid={error ? "true" : undefined}
					aria-required={required || undefined}
					aria-describedby={describedBy || undefined}
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
};

export default PincodeAsyncSelect;
