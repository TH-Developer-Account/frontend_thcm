import { Plus } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import Radio, { type RadioOption } from "../../../../components/forms/Radio";
import TextareaInput from "../../../../components/forms/TextareaInput";

type FormState = {
	label: string;
	addressType: string;
	address: string;
};

type Props = {
	form: FormState;
	onChange: (key: keyof FormState, value: string) => void;
	onAdd: () => void;
	isEditing?: boolean;
};

const addressTypeOptions: RadioOption[] = [
	{ label: "Head Office", value: "Head Office" },
	{ label: "Branch Office", value: "Branch Office" },
	{ label: "Billing Address", value: "Billing Address" },
	{ label: "Warehouse", value: "Warehouse" },
];

const BPAddressFormCard = ({
	form,
	onChange,
	onAdd,
	isEditing = false,
}: Props) => {
	const isActionDisabled = !form.address.trim();

	return (
		<div className="bp-address-form-card">
			<Card
				title={isEditing ? "Edit Address" : "Add Address"}
				footer={
					<div className="bp-address-card-footer-actions">
						<Button
							type="button"
							text={isEditing ? "Update Address" : "Add Address"}
							appearance="standard"
							variant="brand"
							size="sm"
							Icon={Plus}
							iconPosition="right"
							onClick={onAdd}
							disabled={isActionDisabled}
						/>
					</div>
				}
			>
				<div className="bp-address-form">
					<div className="bp-address-form-row">
						<div className="bp-address-field">
							<FormInput
								name="label"
								label="Address Label"
								value={form.label}
								onChange={(event) => onChange("label", event.target.value)}
								placeholder="Example: Corporate Office"
							/>
						</div>

						<div className="bp-address-field bp-address-type-field">
							<Radio
								groupLabel="Address Type"
								name="addressType"
								options={addressTypeOptions}
								selectedValue={form.addressType}
								onChange={(value) => onChange("addressType", value)}
							/>
						</div>
					</div>

					<div className="bp-address-field bp-address-textarea-field">
						<TextareaInput
							name="address"
							label="Address"
							value={form.address}
							onChange={(event) => onChange("address", event.target.value)}
							placeholder="Flat / Building / Street / Area"
							rows={2}
							className="bigtextArea"
						/>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default BPAddressFormCard;
