import { Check, Pencil, Plus, Trash, X } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

export type BPAddressFormState = {
	label: string;
	addressType: string;
	address: string;
};

export type BPAddressFormMode = "create" | "edit" | "view";

type Props = {
	form: BPAddressFormState;
	mode?: BPAddressFormMode;
	isDefault?: boolean;

	onChange?: (key: keyof BPAddressFormState, value: string) => void;

	onSubmit?: () => void;
	onCancel?: () => void;
	onEdit?: () => void;
	onSetDefault?: () => void;
	onRemove?: () => void;
};

type SelectOption = {
	label: string;
	value: string;
};

const addressTypeOptions: SelectOption[] = [
	{
		label: "Head Office",
		value: "Head Office",
	},
	{
		label: "Branch Office",
		value: "Branch Office",
	},
	{
		label: "Billing Address",
		value: "Billing Address",
	},
	{
		label: "Warehouse",
		value: "Warehouse",
	},
];

const getSelectedAddressType = (value: string): SelectOption | null =>
	addressTypeOptions.find((option) => option.value === value) ?? null;

const getCardTitle = (
	mode: BPAddressFormMode,
	form: BPAddressFormState,
): string => {
	if (mode === "create") return "Add Address";
	if (mode === "edit") return "Edit Address";

	return form.label.trim() || form.addressType.trim() || "Address";
};

const BPAddressFormCard = ({
	form,
	mode = "create",
	isDefault = false,
	onChange,
	onSubmit,
	onCancel,
	onEdit,
	onSetDefault,
	onRemove,
}: Props) => {
	const isViewMode = mode === "view";
	const isEditMode = mode === "edit";

	const isActionDisabled = !form.address.trim() || !form.addressType.trim();

	const handleChange = (key: keyof BPAddressFormState, value: string) => {
		if (isViewMode) return;

		onChange?.(key, value);
	};

	const footer = isViewMode ? (
		<>
			{!isDefault && (
				<Button
					type="button"
					text="Set Default"
					Icon={Check}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onSetDefault}
					disabled={!onSetDefault}
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
				disabled={!onEdit}
				isTooltip={
					isDefault ? "Default address cannot be edited" : "Edit address"
				}
			/>

			<Button
				type="button"
				Icon={Trash}
				appearance="icon"
				variant="outline"
				size="sm"
				onClick={onRemove}
				disabled={isDefault || !onRemove}
				isTooltip={
					isDefault ? "Default address cannot be deleted" : "Remove address"
				}
				aria-label={`Remove ${form.label || form.addressType || "address"}`}
			/>
		</>
	) : (
		<>
			{isEditMode && (
				<Button
					type="button"
					text="Cancel"
					Icon={X}
					iconPosition="left"
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onCancel}
				/>
			)}

			<Button
				type="button"
				text={isEditMode ? "Update Address" : "Add Address"}
				Icon={isEditMode ? Check : Plus}
				iconPosition="right"
				appearance="standard"
				variant="brand"
				size="sm"
				onClick={onSubmit}
				disabled={isActionDisabled || !onSubmit}
			/>
		</>
	);

	return (
		<Card
			padding="compact"
			title={getCardTitle(mode, form)}
			actions={
				isDefault ? (
					<span className="bp-address-default-badge">Default</span>
				) : undefined
			}
			footer={footer}
		>
			<div className="bp-address-form">
				<div className="bp-address-form-row">
					<FormInput
						name={`address-label-${mode}`}
						label="Address Label"
						value={form.label}
						onChange={(event) => handleChange("label", event.target.value)}
						placeholder="Example: Corporate Office"
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
					/>
				</div>

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
					/>
				</div>
			</div>
		</Card>
	);
};

export default BPAddressFormCard;
