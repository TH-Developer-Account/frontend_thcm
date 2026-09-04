import { useMemo } from "react";

import { useBPAddressManager } from "../hooks/useBusinessPartners";
import {
	mapAddressToForm,
	formatAddressType,
} from "../utils/businessPartner.mapper";
import type {
	BPAddressPermissions,
	BPAddressViewModel,
} from "../utils/bp.types";

import BPAddressFormCard from "./BPAddressFormCard";

type BPAddressProps = {
	businessPartnerId: string;
	addresses: BPAddressViewModel[];
	permissions: BPAddressPermissions;

	/** Controlled from BPTabs via the "Add Address" action row. */
	isAdding: boolean;
	onCancelAdd: () => void;
	onAdded: () => void;
};

const BPAddress = ({
	addresses: initialAddresses,
	businessPartnerId,
	permissions,
	isAdding,
	onCancelAdd,
	onAdded,
}: BPAddressProps) => {
	const {
		form,
		defaultAddress,
		otherAddresses,
		editingId,
		isEditing,
		handleChange,
		handleAddAddress,
		handleEditAddress,
		handleCopyAddress,
		handleSetDefault,
		handleRemoveAddress,
		resetForm,
	} = useBPAddressManager(businessPartnerId, initialAddresses, permissions);

	const addresses = useMemo(
		() => [...(defaultAddress ? [defaultAddress] : []), ...otherAddresses],
		[defaultAddress, otherAddresses],
	);

	const copyAddressOptions = useMemo(
		() =>
			addresses
				.filter((address) => address.id !== editingId)
				.map((address) => ({
					label: `${
						address.label || formatAddressType(address.addressType)
					} — ${address.address}`,
					value: address.id,
				})),
		[addresses, editingId],
	);

	const showCreateForm = isAdding && !isEditing;

	const handleCancelAdd = () => {
		resetForm();
		onCancelAdd();
	};

	const handleSubmitAdd = async () => {
		await handleAddAddress();
		onAdded();
	};

	return (
		<div className="bp-address-layout">
			<div className="bp-address-list-grid">
				{addresses.map((address) => {
					const isCurrentAddress = editingId === address.id;

					if (isCurrentAddress) {
						return (
							<BPAddressFormCard
								key={address.id}
								form={form}
								mode="edit"
								isDefault={address.isDefault}
								copyAddressOptions={copyAddressOptions}
								onChange={handleChange}
								onCopyAddress={handleCopyAddress}
								onSubmit={handleAddAddress}
								onCancel={resetForm}
							/>
						);
					}

					return (
						<BPAddressFormCard
							key={address.id}
							form={mapAddressToForm(address)}
							mode="view"
							isDefault={address.isDefault}
							onSetDefault={
								address.isDefault
									? undefined
									: () => handleSetDefault(address.id)
							}
							onEdit={() => handleEditAddress(address.id)}
							onRemove={() => handleRemoveAddress(address.id)}
						/>
					);
				})}
				{showCreateForm && (
					<BPAddressFormCard
						form={form}
						mode="create"
						copyAddressOptions={copyAddressOptions}
						onChange={handleChange}
						onCopyAddress={handleCopyAddress}
						onSubmit={handleSubmitAdd}
						onCancel={handleCancelAdd}
					/>
				)}
				{addresses.length === 0 && !showCreateForm && (
					<p className="bp-address-empty">
						No addresses added yet. Use "Add Address" to create one.
					</p>
				)}
			</div>
		</div>
	);
};

export default BPAddress;
