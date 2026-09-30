import { Check, Pencil, Trash } from "lucide-react";

import { Badge } from "../../../../components/common/Badge";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

import type { BPAddressFormState } from "../utils/bp.types";

/**
 * View-only now — create and edit both go through BPAddressCreateForm (RHF +
 * Zod via useBPAddressCardForm), which BPAddress.tsx swaps in for whichever
 * row is being edited. This card used to also render create/edit modes
 * itself with manual state and no validation; that path is gone, along with
 * its "copy from another address" plumbing, which was already dead — the
 * copy-address SelectInput was commented out in the JSX, so removing
 * handleCopyAddress/copyAddressOptions/copyFromAddressId here didn't drop
 * any working feature.
 */
type Props = {
	form: BPAddressFormState;
	isDefault?: boolean;

	isDeleting?: boolean;
	isSettingDefault?: boolean;

	onSetDefault?: () => void;
	onEdit?: () => void;
	onRemove?: () => void;
};

const BPAddressFormCard = ({
	form,
	isDefault = false,
	isDeleting = false,
	isSettingDefault = false,
	onSetDefault,
	onEdit,
	onRemove,
}: Props) => {
	const isPending = isDeleting || isSettingDefault;
	const noop = () => undefined;

	const footer = (
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
				aria-label={`Edit ${form.label || "address"}`}
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
				aria-label={`Remove ${form.label || "address"}`}
			/>
		</>
	);

	return (
		<Card
			padding="compact"
			title={form.label.trim() || "Address"}
			actions={isDefault ? <Badge variant="info">Default</Badge> : undefined}
			footer={footer}
		>
			<div className="bp-address-form">
				<FormInput
					name="address-label"
					label="Address Label"
					value={form.label}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="city"
					label="City"
					value={form.city}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="state"
					label="State"
					value={form.state}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="country"
					label="Country"
					value={form.country}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="pincode"
					label="PIN Code"
					value={form.pincode}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="region"
					label="Region"
					value={form.region}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="zone"
					label="Zone"
					value={form.zone}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="latitude"
					label="Latitude"
					value={form.latitude}
					onChange={noop}
					mode="view"
				/>

				<FormInput
					name="longitude"
					label="Longitude"
					value={form.longitude}
					onChange={noop}
					mode="view"
				/>

				<div className="bp-address-field bp-address-textarea-field">
					<TextareaInput
						name="address"
						label="Address"
						value={form.address}
						onChange={noop}
						className="bigtextArea"
						rows={4}
						mode="view"
					/>
				</div>
			</div>
		</Card>
	);
};

export default BPAddressFormCard;
