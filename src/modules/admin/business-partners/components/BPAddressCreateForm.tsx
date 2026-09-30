import { Controller, type FieldPath } from "react-hook-form";

import Button from "../../../../components/common/Button";
import Checkbox from "../../../../components/forms/Checkbox";
import FormInput from "../../../../components/forms/FormInput";
// import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";
import { businessPartnerContent } from "../../../../content/businessPartner.content";

import { useBPAddressCardForm } from "../hooks/useBPAddressCardForm";
import {
	normalizeMobileInput,
	type BPAddressCardFormValues,
} from "../utils/businessPartner.schema";
import type { BPAddressViewModel } from "../utils/bp.types";
import Card from "../../../../components/common/Card";
// import type { BusinessPartnerAddressType } from "../utils/bp.types";

const copy = businessPartnerContent.address;

// type AddressTypeOption = {
// 	label: string;
// 	value: BusinessPartnerAddressType;
// };

// Same options/labels as BPAddressFormCard so both entry points match.
// const ADDRESS_TYPE_OPTIONS: AddressTypeOption[] = [
// 	{ label: "Head Office", value: "HEAD_OFFICE" },
// 	{ label: "Branch Office", value: "BRANCH_OFFICE" },
// 	{ label: "Plant", value: "PLANT" },
// 	{ label: "Billing Address", value: "BILLING_ADDRESS" },
// 	{ label: "Shipping Address", value: "SHIPPING_ADDRESS" },
// 	{ label: "Warehouse", value: "WAREHOUSE" },
// ];

type TextFieldName = Exclude<
	FieldPath<BPAddressCardFormValues>,
	"addressType" | "isDefault" | "address"
>;

type TextFieldConfig = {
	name: TextFieldName;
	type?: "text" | "email" | "tel" | "url";
	inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
	autoComplete?: string;
	required?: boolean;
	placeholder?: string;
	/** Input mask applied before the value reaches RHF. */
	normalize?: (value: string) => string;
	/**
	 * Re-run this field's Zod rule on every change, instead of waiting for
	 * blur (the form-wide mode stays onBlur for everything else).
	 */
	validateOnChange?: boolean;
};

const TEXT_FIELDS: TextFieldConfig[] = [
	{ name: "city", required: true },
	{ name: "state", required: true },
	{ name: "country", required: true },
	{ name: "pincode", required: true },
	{ name: "region" },
	{ name: "zone" },
	{ name: "branch" },
	// Coordinates must be text inputs: a type="number" input reports "" for
	// anything it can't parse (e.g. 12°58'16.3"N), so RHF received an empty
	// value and the payload silently sent null. The schema's parseCoordinate
	// validates both decimal and DMS, and the mapper converts to decimal.
	// No inputMode="decimal": the numeric keypad can't type ° ' " N/E/S/W.
	{ name: "latitude", type: "text", autoComplete: "off" },
	{ name: "longitude", type: "text", autoComplete: "off" },
	{ name: "email", type: "email", inputMode: "email" },
	{
		name: "phoneNumber",
		type: "tel",
		inputMode: "numeric",
		autoComplete: "tel-national",
		normalize: normalizeMobileInput,
		validateOnChange: true,
	},
	{ name: "website", type: "url", inputMode: "url" },
];

type BPAddressCreateFormProps = {
	businessPartnerId: string;
	/** Present => editing this existing address instead of creating a new one. */
	address?: BPAddressViewModel;
	hasExistingAddresses: boolean;
	onSaved: () => void;
	onCancel: () => void;
};

/**
 * Renders both the "add address" and "edit address" forms — same validated
 * fields either way, just create vs update underneath (see
 * useBPAddressCardForm). Mounted only while open, so every open starts from
 * fresh defaults (including isDefault for a brand-new first address).
 */
const BPAddressCreateForm = ({
	businessPartnerId,
	address,
	hasExistingAddresses,
	onSaved,
	onCancel,
}: BPAddressCreateFormProps) => {
	const { form, formRef, isEditMode, isSaving, onSubmit, reset } =
		useBPAddressCardForm({
			businessPartnerId,
			address,
			hasExistingAddresses,
			onSaved,
		});

	const { control, trigger } = form;

	const handleCancel = () => {
		reset();
		onCancel();
	};

	return (
		<Card
			footer={
				<div className="bottom-buttons-bar-end">
					<Button
						type="button"
						text={copy.actions.cancel}
						variant="secondary"
						onClick={handleCancel}
						disabled={isSaving}
					/>

					<Button
						type="submit"
						text={
							isSaving
								? isEditMode
									? "Updating..."
									: copy.actions.saving
								: isEditMode
									? "Update Address"
									: copy.actions.save
						}
						variant="brand"
						disabled={isSaving}
					/>
				</div>
			}
		>
			<form
				ref={formRef}
				noValidate
				// TODO: businessPartnerContent.address has no distinct edit-mode
				// label yet (see other TODOs in BPGeneralInfoCard.tsx / useBPOrganizationInfoCardForm.ts)
				aria-label={isEditMode ? "Edit Address" : copy.add}
				onSubmit={(event) => {
					void onSubmit(event);
				}}
			>
				<div className="bp-address-form">
					<Controller
						control={control}
						name="label"
						render={({ field, fieldState }) => (
							<FormInput
								name={field.name}
								label={copy.fields.label}
								placeholder={copy.placeholders.label}
								value={field.value}
								onChange={(event) => field.onChange(event.target.value)}
								onBlur={field.onBlur}
								error={fieldState.error?.message}
								disabled={isSaving}
							/>
						)}
					/>

					{/* <Controller
					control={control}
					name="addressType"
					render={({ field, fieldState }) => (
						<SelectInput<AddressTypeOption>
							inputId="bp-address-addressType"
							name={field.name}
							label={copy.fields.addressType}
							placeholder={copy.placeholders.addressType}
							options={ADDRESS_TYPE_OPTIONS}
							value={
								ADDRESS_TYPE_OPTIONS.find(
									(option) => option.value === field.value,
								) ?? null
							}
							onChange={(option) => field.onChange(option?.value ?? "")}
							error={fieldState.error?.message}
							isDisabled={isSaving}
							required
						/>
					)}
				/> */}

					{TEXT_FIELDS.map((config) => (
						<Controller
							key={config.name}
							control={control}
							name={config.name}
							render={({ field, fieldState }) => (
								<FormInput
									name={field.name}
									label={copy.fields[config.name]}
									type={config.type ?? "text"}
									inputMode={config.inputMode}
									autoComplete={config.autoComplete}
									placeholder={config.placeholder}
									value={field.value}
									onChange={(event) => {
										const nextValue = config.normalize
											? config.normalize(event.target.value)
											: event.target.value;

										field.onChange(nextValue);

										if (config.validateOnChange) {
											void trigger(config.name);
										}
									}}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									disabled={isSaving}
									required={config.required}
								/>
							)}
						/>
					))}

					<div className="bp-create-card-full-row">
						<Controller
							control={control}
							name="address"
							render={({ field, fieldState }) => (
								<TextareaInput
									name={field.name}
									label={copy.fields.address}
									placeholder={copy.placeholders.address}
									value={field.value}
									onChange={(event) => field.onChange(event.target.value)}
									onBlur={field.onBlur}
									error={fieldState.error?.message}
									className="bigtextArea"
									rows={4}
									disabled={isSaving}
									required
								/>
							)}
						/>
					</div>

					{!isEditMode && (
						<div className="bp-create-card-full-row">
							<Controller
								control={control}
								name="isDefault"
								render={({ field }) => (
									<Checkbox
										name={field.name}
										label={copy.fields.isDefault}
										checked={field.value}
										disabled={isSaving}
										onChange={(checked) => field.onChange(Boolean(checked))}
									/>
								)}
							/>
						</div>
					)}
				</div>
			</form>
		</Card>
	);
};

export default BPAddressCreateForm;
