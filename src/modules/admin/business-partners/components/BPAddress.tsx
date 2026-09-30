import { useMemo, useState } from "react";

import { useBusinessPartnerAddressMutations } from "../hooks/useBusinessPartnerMutations";
import { mapAddressToForm } from "../utils/businessPartner.mapper";
import type {
	BPAddressPermissions,
	BPAddressViewModel,
} from "../utils/bp.types";

import BPAddressCreateForm from "./BPAddressCreateForm";
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

/**
 * Create and edit both go through BPAddressCreateForm now (RHF + Zod via
 * useBPAddressCardForm) — this component just tracks which row, if any, is
 * being edited, and derives the default/other split for display order.
 * useBPAddressManager (the old manual-state hook this used to own) is gone:
 * it only ever had one caller, so its list-derivation and guarded
 * delete/set-default logic live here directly instead of behind a
 * separate hook (its create/edit form-state half became dead once
 * BPAddressCreateForm took over both flows).
 */
const BPAddress = ({
	addresses: initialAddresses,
	businessPartnerId,
	permissions,
	isAdding,
	onCancelAdd,
	onAdded,
}: BPAddressProps) => {
	const [editingId, setEditingId] = useState<string | null>(null);

	const {
		deleteAddress,
		setDefaultAddress,
		isDeletingAddress,
		isSettingDefault,
	} = useBusinessPartnerAddressMutations(businessPartnerId);

	const defaultAddress = useMemo(
		() =>
			initialAddresses.find((address) => address.isDefault) ??
			initialAddresses[0] ??
			null,
		[initialAddresses],
	);

	const otherAddresses = useMemo(
		() =>
			initialAddresses.filter((address) => address.id !== defaultAddress?.id),
		[initialAddresses, defaultAddress?.id],
	);

	const addresses = useMemo(
		() => [...(defaultAddress ? [defaultAddress] : []), ...otherAddresses],
		[defaultAddress, otherAddresses],
	);

	const editingAddress = editingId
		? (addresses.find((address) => address.id === editingId) ?? null)
		: null;

	const handleEditAddress = (addressId: string) => {
		if (!permissions.canUpdateAddress) return;

		setEditingId(addressId);
	};

	const handleSetDefault = async (addressId: string) => {
		if (!permissions.canSetDefaultAddress) return;

		try {
			await setDefaultAddress(addressId);
		} catch {
			// Mutation exposes the error.
		}
	};

	const handleRemoveAddress = async (addressId: string) => {
		if (!permissions.canDeleteAddress) return;

		const target = addresses.find((address) => address.id === addressId);
		if (!target || target.isDefault) return;

		try {
			await deleteAddress(addressId);

			if (editingId === addressId) setEditingId(null);
		} catch {
			// Mutation exposes the error.
		}
	};

	const showCreateForm = isAdding && !editingId;

	const handleCancelAdd = () => {
		onCancelAdd();
	};

	return (
		<div className="bp-address-layout">
			<div className="bp-address-list-grid">
				{addresses.map((address) => {
					if (editingId === address.id && editingAddress) {
						return (
							<BPAddressCreateForm
								key={address.id}
								businessPartnerId={businessPartnerId}
								address={editingAddress}
								hasExistingAddresses
								onSaved={() => setEditingId(null)}
								onCancel={() => setEditingId(null)}
							/>
						);
					}

					return (
						<BPAddressFormCard
							key={address.id}
							form={mapAddressToForm(address)}
							isDefault={address.isDefault}
							isDeleting={isDeletingAddress}
							isSettingDefault={isSettingDefault}
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
					<BPAddressCreateForm
						businessPartnerId={businessPartnerId}
						hasExistingAddresses={addresses.length > 0}
						onSaved={onAdded}
						onCancel={handleCancelAdd}
					/>
				)}
			</div>
		</div>
	);
};

export default BPAddress;
