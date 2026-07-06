import React from "react";
import BPAddressFormCard from "./BPAddressFormCard";
import BPAddressListCard from "./BPAddressListCard";

export type AddressItem = {
	id: string;
	label?: string;
	address: string;
	isDefault?: boolean;
};

const emptyForm = {
	label: "",
	address: "",
};

const BPAddress = () => {
	const [form, setForm] = React.useState(emptyForm);
	const [editingId, setEditingId] = React.useState<string | null>(null);

	const [addresses, setAddresses] = React.useState<AddressItem[]>([
		{
			id: "1",
			label: "Head Office",
			address:
				"342, 2nd Floor, Bandra West Near Linking Road, Mumbai, Maharashtra, India 400050",
			isDefault: true,
		},
	]);

	const defaultAddress =
		addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

	const otherAddresses = addresses.filter((address) => !address.isDefault);

	const handleChange = (key: keyof typeof emptyForm, value: string) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const resetForm = () => {
		setForm(emptyForm);
		setEditingId(null);
	};

	const handleAddAddress = () => {
		if (!form.address.trim()) return;

		if (editingId) {
			setAddresses((prev) =>
				prev.map((address) =>
					address.id === editingId
						? {
								...address,
								label: form.label.trim(),
								address: form.address.trim(),
							}
						: address,
				),
			);
			resetForm();
			return;
		}

		const newAddress: AddressItem = {
			id: crypto.randomUUID(),
			label: form.label.trim(),
			address: form.address.trim(),
			isDefault: addresses.length === 0,
		};

		setAddresses((prev) => [...prev, newAddress]);
		resetForm();
	};

	const handleEditAddress = (id: string) => {
		const target = addresses.find((address) => address.id === id);
		if (!target) return;

		setForm({
			label: target.label || "",
			address: target.address,
		});
		setEditingId(id);
	};

	const handleSetDefault = (id: string) => {
		setAddresses((prev) =>
			prev.map((address) => ({
				...address,
				isDefault: address.id === id,
			})),
		);
	};

	const handleRemoveAddress = (id: string) => {
		setAddresses((prev) => {
			const target = prev.find((address) => address.id === id);
			const remaining = prev.filter((address) => address.id !== id);

			if (editingId === id) {
				resetForm();
			}

			if (!target?.isDefault) return remaining;
			if (remaining.length === 0) return [];

			return remaining.map((address, index) => ({
				...address,
				isDefault: index === 0,
			}));
		});
	};

	return (
		<div className="bp-gen-content">
			<div className="bp-address-grid-wrap">
				<BPAddressFormCard
					form={form}
					onChange={handleChange}
					onAdd={handleAddAddress}
					isEditing={Boolean(editingId)}
				/>

				{defaultAddress && (
					<BPAddressListCard
						title="Default Address"
						address={defaultAddress}
						showActions={false}
					/>
				)}

				{otherAddresses.map((address) => (
					<BPAddressListCard
						key={address.id}
						title={address.label || "Address"}
						address={address}
						showActions
						onSetDefault={() => handleSetDefault(address.id)}
						onEdit={() => handleEditAddress(address.id)}
						onRemove={() => handleRemoveAddress(address.id)}
					/>
				))}
			</div>
		</div>
	);
};

export default BPAddress;
