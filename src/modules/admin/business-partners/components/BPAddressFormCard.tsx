// import { useState } from "react";
import {
	Check,
	//  Copy,
	Pencil,
	Plus,
	Trash,
	X,
} from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

import type {
	BPAddressFormState,
	BusinessPartnerAddressType,
} from "../utils/bp.types";
import { Badge } from "../../../../components/common/Badge";

export type BPAddressFormMode = "create" | "edit" | "view";

type SelectOption = {
	label: string;
	value: string;
};

type AddressTypeOption = {
	label: string;
	value: BusinessPartnerAddressType;
};

type Props = {
	form: BPAddressFormState;
	mode?: BPAddressFormMode;
	isDefault?: boolean;
	copyAddressOptions?: SelectOption[];

	isSubmitting?: boolean;
	isDeleting?: boolean;
	isSettingDefault?: boolean;

	onChange?: (key: keyof BPAddressFormState, value: string) => void;

	onCopyAddress?: (addressId: string) => void;
	onSubmit?: () => void;
	onCancel?: () => void;
	onEdit?: () => void;
	onSetDefault?: () => void;
	onRemove?: () => void;
};

const addressTypeOptions: AddressTypeOption[] = [
	{ label: "Head Office", value: "HEAD_OFFICE" },
	{ label: "Branch Office", value: "BRANCH_OFFICE" },
	{ label: "Plant", value: "PLANT" },
	{ label: "Billing Address", value: "BILLING_ADDRESS" },
	{ label: "Shipping Address", value: "SHIPPING_ADDRESS" },
	{ label: "Warehouse", value: "WAREHOUSE" },
];

const getSelectedAddressType = (
	value: BPAddressFormState["addressType"],
): AddressTypeOption | null =>
	addressTypeOptions.find((option) => option.value === value) ?? null;

const getCardTitle = (
	mode: BPAddressFormMode,
	form: BPAddressFormState,
): string => {
	if (mode === "create") return "Add Address";
	if (mode === "edit") return "Edit Address";

	return (
		form.label.trim() ||
		getSelectedAddressType(form.addressType)?.label ||
		"Address"
	);
};

const BPAddressFormCard = ({
	form,
	mode = "create",
	isDefault = false,
	// copyAddressOptions = [],

	isSubmitting = false,
	isDeleting = false,
	isSettingDefault = false,

	// onCopyAddress,
	onChange,
	onSubmit,
	onCancel,
	onEdit,
	onSetDefault,
	onRemove,
}: Props) => {
	const isViewMode = mode === "view";
	const isEditMode = mode === "edit";
	const isCreateMode = mode === "create";
	const isPending = isSubmitting || isDeleting || isSettingDefault;

	const isActionDisabled = !form.address.trim() || !form.addressType;

	// const [showCopyAddress, setShowCopyAddress] = useState(false);

	const handleChange = (key: keyof BPAddressFormState, value: string) => {
		if (isViewMode) return;

		onChange?.(key, value);
	};

	// const handleToggleCopyAddress = () => {
	// 	setShowCopyAddress((current) => {
	// 		const next = !current;

	// 		// Clear any selected source address when hiding the picker.
	// 		if (!next) onCopyAddress?.("");

	// 		return next;
	// 	});
	// };

	const showCanCancel = (isEditMode || isCreateMode) && Boolean(onCancel);

	const footer = isViewMode ? (
		<>
			{!isDefault && (
				<Button
					type="button"
					text={isSettingDefault ? "Setting Default..." : "Set Default"}
					Icon={Check}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onSetDefault}
					disabled={!onSetDefault || isPending}
				/>
			)}

			<Button
				type="button"
				Icon={Pencil}
				iconPosition="left"
				appearance="standard"
				variant="outline"
				size="sm"
				onClick={onEdit}
				disabled={isDefault || !onEdit || isPending}
				isTooltip={
					isDefault ? "Default address cannot be edited" : "Edit address"
				}
				aria-label={`Edit ${
					form.label ||
					getSelectedAddressType(form.addressType)?.label ||
					"address"
				}`}
			/>

			<Button
				type="button"
				Icon={Trash}
				appearance="icon"
				variant="outline"
				size="sm"
				onClick={onRemove}
				disabled={isDefault || !onRemove || isPending}
				isTooltip={
					isDefault
						? "Default address cannot be deleted"
						: isDeleting
							? "Removing address"
							: "Remove address"
				}
				aria-label={`Remove ${
					form.label ||
					getSelectedAddressType(form.addressType)?.label ||
					"address"
				}`}
			/>
		</>
	) : (
		<>
			{showCanCancel && (
				<Button
					type="button"
					text="Cancel"
					Icon={X}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onCancel}
					disabled={isSubmitting}
				/>
			)}

			<Button
				type="button"
				text={
					isSubmitting
						? isEditMode
							? "Updating..."
							: "Adding..."
						: isEditMode
							? "Update Address"
							: "Add Address"
				}
				Icon={isEditMode ? Check : Plus}
				iconPosition="right"
				appearance="standard"
				variant="brand"
				size="sm"
				onClick={onSubmit}
				disabled={isActionDisabled || !onSubmit || isPending}
			/>
		</>
	);

	return (
		<Card
			padding="compact"
			title={getCardTitle(mode, form)}
			actions={isDefault ? <Badge variant="info">Default</Badge> : undefined}
			// actions={
			// 	isDefault ? (
			// 		<span className="bp-address-default-badge">Default</span>
			// 	) : !isViewMode && copyAddressOptions.length > 0 ? (
			// 		<Button
			// 			type="button"
			// 			text={showCopyAddress ? "Copying from..." : "Copy Address"}
			// 			Icon={Copy}
			// 			iconPosition="left"
			// 			appearance="standard"
			// 			variant={showCopyAddress ? "brand" : "outline"}
			// 			size="sm"
			// 			onClick={handleToggleCopyAddress}
			// 			disabled={isSubmitting}
			// 		/>
			// 	) : undefined
			// }
			footer={footer}
		>
			<div className="bp-address-form">
				{/* {!isViewMode &&
					 && showCopyAddress
					copyAddressOptions.length > 0 && (
						<SelectInput
							name={`copy-address-${mode}`}
							label="Copy details from"
							placeholder="Select an existing address"
							options={copyAddressOptions}
							value={
								copyAddressOptions.find(
									(option) => option.value === form.copyFromAddressId,
								) ?? null
							}
							onChange={(option) => onCopyAddress?.(option?.value ?? "")}
							isDisabled={isSubmitting}
						/>
					)} */}

				<FormInput
					name={`address-label-${mode}`}
					label="Address Label"
					value={form.label}
					placeholder="Example: Corporate Office"
					onChange={(event) => handleChange("label", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<SelectInput
					name={`address-type-${mode}`}
					label="Address Type"
					placeholder="Select address type"
					options={addressTypeOptions}
					value={getSelectedAddressType(form.addressType)}
					onChange={(option) =>
						handleChange("addressType", option?.value ?? "")
					}
					mode={isViewMode ? "view" : "edit"}
					required
				/>

				<div className="bp-address-field bp-address-textarea-field">
					<TextareaInput
						name={`address-${mode}`}
						label="Address"
						value={form.address}
						onChange={(event) => handleChange("address", event.target.value)}
						placeholder="Flat / Building / Street / Area"
						className="bigtextArea"
						rows={4}
						mode={isViewMode ? "view" : "edit"}
						required
					/>
				</div>
				{/* <FormInput
					name={`city-${mode}`}
					label="City"
					value={form.city}
					onChange={(event) => handleChange("city", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`state-${mode}`}
					label="State"
					value={form.state}
					onChange={(event) => handleChange("state", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`country-${mode}`}
					label="Country"
					value={form.country}
					onChange={(event) => handleChange("country", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`pincode-${mode}`}
					label="PIN Code"
					value={form.pincode}
					onChange={(event) => handleChange("pincode", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`region-${mode}`}
					label="Region"
					value={form.region}
					onChange={(event) => handleChange("region", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`zone-${mode}`}
					label="Zone"
					value={form.zone}
					onChange={(event) => handleChange("zone", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`branch-${mode}`}
					label="Branch"
					value={form.branch}
					onChange={(event) => handleChange("branch", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`website-${mode}`}
					label="Website"
					value={form.website}
					onChange={(event) => handleChange("website", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`latitude-${mode}`}
					label="Latitude"
					type="number"
					value={form.latitude}
					onChange={(event) => handleChange("latitude", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/>

				<FormInput
					name={`longitude-${mode}`}
					label="Longitude"
					type="number"
					value={form.longitude}
					onChange={(event) => handleChange("longitude", event.target.value)}
					mode={isViewMode ? "view" : "edit"}
				/> */}
			</div>
		</Card>
	);
};

export default BPAddressFormCard;
