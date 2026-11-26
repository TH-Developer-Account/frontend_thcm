import React, { useId, useState } from "react";
import Select, { components } from "react-select";
import type {
	InputActionMeta,
	InputProps as ReactSelectInputProps,
	MultiValue,
	SingleValue,
} from "react-select";
import { useDebounce } from "../../../hooks/useDebounce";
import { ServerAxios } from "../../../services/ServerAxios";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { CircleCheck } from "lucide-react";

/*
 * Mirrors AsyncSelect.tsx's UserOption/UserAsyncSelect shape exactly, scoped
 * to Business Partners. Talks to ServerAxios directly (not
 * businessPartnerApi) for the same reason AsyncSelect.tsx does: this is a
 * shared /components/forms control, not a BP-feature-module file, so it
 * shouldn't reach into that module's api layer.
 */
export type BusinessPartnerOption = {
	value: string;
	label: string;
	bpType?: string;
	officeType?: string;
};

type BusinessPartnerListApiRow = {
	id: string;
	bpName: string;
	bpType?: string;
	officeType?: string;
};

type BusinessPartnerAsyncSelectBaseProps = {
	name?: string;
	placeholder?: string;
	isClearable?: boolean;
	isDisabled?: boolean;
	required?: boolean;
	error?: string;
	label?: string;
	helperText?: string;
	className?: string;
	success?: boolean;
	/** Only partners with this active flag (e.g. true = active only). Omit for all. */
	isActive?: boolean;
	/** Only partners of this type (e.g. "DEALER"). Omit for all. */
	bpType?: string;
};

type BusinessPartnerSingleProps = BusinessPartnerAsyncSelectBaseProps & {
	isMulti?: false;
	value?: BusinessPartnerOption | null;
	onChange: (partner: BusinessPartnerOption | null) => void;
};

type BusinessPartnerMultiProps = BusinessPartnerAsyncSelectBaseProps & {
	isMulti: true;
	value?: BusinessPartnerOption[];
	onChange: (partners: BusinessPartnerOption[]) => void;
};

type BusinessPartnerAsyncSelectProps =
	| BusinessPartnerSingleProps
	| BusinessPartnerMultiProps;

const NoAutofillInput = (
	props: ReactSelectInputProps<BusinessPartnerOption, boolean>,
) => (
	<components.Input
		{...props}
		autoComplete="off"
		data-lpignore="true"
		data-1p-ignore="true"
		data-bwignore="true"
		data-form-type="other"
	/>
);

const BusinessPartnerAsyncSelect: React.FC<BusinessPartnerAsyncSelectProps> = (
	props,
) => {
	const {
		name = "businessPartner",
		error,
		label,
		helperText,
		placeholder = "Search business partners...",
		isClearable = true,
		isDisabled = false,
		required = false,
		success,
		className = "",
		isActive,
		bpType,
	} = props;
	const isMulti = props.isMulti === true;
	const selectValue = props.isMulti
		? (props.value ?? [])
		: (props.value ?? null);

	const generatedId = useId();
	const inputId = `${name}-${generatedId}`;
	const errorId = error ? `${inputId}-error` : undefined;
	const helperId = helperText && !error ? `${inputId}-helper` : undefined;
	const describedBy = errorId ?? helperId;

	const [inputValue, setInputValue] = useState("");
	const [options, setOptions] = useState<BusinessPartnerOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const debouncedInput = useDebounce(inputValue.trim(), 400);

	React.useEffect(() => {
		if (!debouncedInput || isDisabled) return;

		const controller = new AbortController();
		let requestIsActive = true;

		const fetchPartners = async () => {
			try {
				const { data } = await ServerAxios.get<
					| BusinessPartnerListApiRow[]
					| {
							rows?: BusinessPartnerListApiRow[];
							data?: BusinessPartnerListApiRow[];
					  }
				>("/business-partner", {
					params: {
						search: debouncedInput,
						// Keep the result list short for a searchable dropdown —
						// this is a picker, not the full BP listing page.
						limit: 20,
						...(isActive !== undefined ? { isActive } : {}),
						...(bpType ? { bpType } : {}),
					},
					signal: controller.signal,
				});

				if (!requestIsActive) return;

				const rows = Array.isArray(data)
					? data
					: (data.rows ?? data.data ?? []);

				setOptions(
					rows.map((partner) => ({
						value: partner.id,
						label: partner.bpName,
						bpType: partner.bpType,
						officeType: partner.officeType,
					})),
				);
			} catch (err) {
				if (!requestIsActive || controller.signal.aborted) return;

				console.error("Business partner search failed:", err);
				setOptions([]);
			} finally {
				if (requestIsActive) {
					setIsLoading(false);
				}
			}
		};

		void fetchPartners();

		return () => {
			requestIsActive = false;
			controller.abort();
		};
	}, [debouncedInput, isDisabled, isActive, bpType]);

	const handleInputChange = (
		nextValue: string,
		actionMeta: InputActionMeta,
	) => {
		if (actionMeta.action !== "input-change") {
			return;
		}

		setInputValue(nextValue);

		if (!nextValue.trim()) {
			setOptions([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
	};

	const handleChange = (
		selected:
			| SingleValue<BusinessPartnerOption>
			| MultiValue<BusinessPartnerOption>,
	) => {
		if (props.isMulti) {
			// Keep the search and results so several partners can be picked in a row.
			props.onChange([...(selected as MultiValue<BusinessPartnerOption>)]);
			return;
		}
		props.onChange(selected as SingleValue<BusinessPartnerOption>);
		setInputValue("");
		setOptions([]);
		setIsLoading(false);
	};

	return (
		<div
			className={[
				"form-field",
				"select-field",
				"bp-async-select-field",
				error ? "has-error" : "",
				isDisabled ? "is-disabled" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{label && (
				<div className="form-label-row">
					<label htmlFor={inputId} className="form-label">
						{label}

						{required && (
							<span className="form-required" aria-hidden="true">
								*
							</span>
						)}
					</label>
				</div>
			)}

			<div className="form-input-wrapper">
				<Select<BusinessPartnerOption, boolean>
					isMulti={isMulti}
					closeMenuOnSelect={!isMulti}
					hideSelectedOptions={isMulti}
					inputId={inputId}
					name={name}
					value={selectValue}
					inputValue={inputValue}
					options={options}
					isLoading={isLoading}
					isDisabled={isDisabled}
					isClearable={isClearable}
					placeholder={placeholder}
					filterOption={null}
					components={{ Input: NoAutofillInput }}
					unstyled
					className={[
						"react-select-container",
						error ? "react-select-container-error" : "",
						isDisabled ? "react-select-container-disabled" : "",
						className,
						success && !error ? "react-select-container-success" : "",
					]
						.filter(Boolean)
						.join(" ")}
					classNamePrefix="react-select"
					menuPortalTarget={
						typeof document !== "undefined" ? document.body : undefined
					}
					menuPosition="fixed"
					menuPlacement="auto"
					aria-invalid={error ? "true" : undefined}
					aria-describedby={describedBy}
					aria-required={required || undefined}
					aria-errormessage={error ? errorId : undefined}
					onInputChange={handleInputChange}
					onChange={handleChange}
					noOptionsMessage={({ inputValue: currentInput }) =>
						currentInput.trim()
							? "No matching business partners found"
							: "Start typing to search business partners"
					}
					loadingMessage={() => "Searching business partners..."}
					formatOptionLabel={(option) => (
						<div className="select-option-content">
							<div className="select-option-primary">{option.label}</div>

							{option.bpType && (
								<div className="select-option-secondary">{option.bpType}</div>
							)}
						</div>
					)}
				/>

				{error ? (
					<ExclamationCircleIcon
						aria-hidden="true"
						className="form-error-icon select-error-icon"
					/>
				) : success ? (
					<CircleCheck
						aria-hidden="true"
						className="form-success-icon select-success-icon"
					/>
				) : null}
			</div>

			{error ? (
				<p id={errorId} className="form-error-text" role="alert">
					{error}
				</p>
			) : helperText ? (
				<p id={helperId} className="form-helper-text">
					{helperText}
				</p>
			) : null}
		</div>
	);
};

export default BusinessPartnerAsyncSelect;
