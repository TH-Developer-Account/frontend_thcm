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
					<p className="bp-info-label">Address Type</p>

					<div className="bp-radio-group">
						<FormInput
							type="radio"
							label="Head Office"
							name="addressType"
							value="Head Office"
							checked={form.label === "Head Office"}
							onChange={() => onChange("label", "Head Office")}
						/>

						<FormInput
							type="radio"
							label="Branch Office"
							name="addressType"
							value="Branch Office"
							checked={form.label === "Branch Office"}
							onChange={() => onChange("label", "Branch Office")}
						/>

						<FormInput
							type="radio"
							label="Billing Address"
							name="addressType"
							value="Billing Address"
							checked={form.label === "Billing Address"}
							onChange={() => onChange("label", "Billing Address")}
						/>

						<FormInput
							type="radio"
							label="Warehouse"
							name="addressType"
							value="Warehouse"
							checked={form.label === "Warehouse"}
							onChange={() => onChange("label", "Warehouse")}
						/>
					</div>
				</div>

				<div className="bp-address-field">
					<TextareaInput
						name="address"
						label="Address"
						value={form.address}
						onChange={(e) => onChange("address", e.target.value)}
						placeholder="Flat / Building / Street / Area"
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
