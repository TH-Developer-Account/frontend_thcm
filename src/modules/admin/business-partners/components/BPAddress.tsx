import {
	type BPAddressViewModel,
	useBPAddressManager,
} from "../hooks/useBusinessPartners";

import BPAddressFormCard, {
	type BPAddressFormState,
} from "./BPAddressFormCard";

type BPAddressProps = {
	addresses: BPAddressViewModel[];
};

const toAddressForm = (address: BPAddressViewModel): BPAddressFormState => ({
	label: address.label,
	addressType: address.addressType,
	address: address.address,
});

const BPAddress = ({ addresses: initialAddresses }: BPAddressProps) => {
	const {
		form,
		defaultAddress,
		otherAddresses,
		editingId,
		isEditing,
		handleChange,
		handleAddAddress,
		handleEditAddress,
		handleSetDefault,
		handleRemoveAddress,
		resetForm,
	} = useBPAddressManager(initialAddresses);

	const addresses = [
		...(defaultAddress ? [defaultAddress] : []),
		...otherAddresses,
	];

	return (
		<div className="bp-gen-content">
			<div className="bp-address-layout">
				<div className="bp-address-list-grid">
					{addresses.length > 0 ? (
						addresses.map((address) => {
							const isCurrentAddress = editingId === address.id;

							if (isCurrentAddress) {
								return (
									<BPAddressFormCard
										key={address.id}
										form={form}
										mode="edit"
										isDefault={address.isDefault}
										onChange={handleChange}
										onSubmit={handleAddAddress}
										onCancel={resetForm}
									/>
								);
							}

							return (
								<BPAddressFormCard
									key={address.id}
									form={toAddressForm(address)}
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
						})
					) : (
						<p className="bp-address-empty">No addresses found.</p>
					)}
					{!isEditing && (
						<BPAddressFormCard
							form={form}
							mode="create"
							onChange={handleChange}
							onSubmit={handleAddAddress}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default BPAddress;
