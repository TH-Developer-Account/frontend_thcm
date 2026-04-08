import React from "react";
import FormInput from "../../../../components/FormElements/FormInput";
import TextareaInput from "../../../../components/FormElements/TextareaInput";

type FormState = {
	label: string;
	address: string;
};

type Props = {
	form: FormState;
	onChange: (key: keyof FormState, value: string) => void;
	onAdd: () => void;
	isEditing?: boolean;
};

const BPAddressFormCard = ({
	form,
	onChange,
	onAdd,
	isEditing = false,
}: Props) => {
	return (
		<div className="bp-address-card">
			<div className="bp-address-card-header">
				<h5>{isEditing ? "Edit Address" : "Add Address"}</h5>
				<button type="button" className="bp-address-add-btn" onClick={onAdd}>
					{isEditing ? "Update" : "Add"}
				</button>
			</div>

			<div className="bp-address-form">
				<div className="bp-address-field">
					<FormInput
						label="Label"
						value={form.label}
						onChange={(e) => onChange("label", e.target.value)}
						placeholder="Label"
					/>
				</div>

				<div className="bp-address-field">
					<TextareaInput
						name="address"
						label="Address"
						value={form.address}
						onChange={(e) => onChange("address", e.target.value)}
						placeholder="Enter address"
						rows={4}
						maxLength={100}
						className="px-1.5 py-1 bigtextArea"
					/>
				</div>
			</div>
		</div>
	);
};

export default BPAddressFormCard;
