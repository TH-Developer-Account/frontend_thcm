import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import TextareaInput from "../../../../components/forms/TextareaInput";

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

const addressTypes = [
	"Head Office",
	"Branch Office",
	"Billing Address",
	"Warehouse",
];

const BPAddressFormCard = ({
	form,
	onChange,
	onAdd,
	isEditing = false,
}: Props) => {
	const isActionDisabled = !form.address.trim();

	return (
		<Card>
			<div className="bp-address-card-header">
				<h5>{isEditing ? "Edit Address" : "Add Address"}</h5>

				<Button
					type="button"
					text={isEditing ? "Update" : "Add"}
					appearance="standard"
					variant="brand"
					size="sm"
					onClick={onAdd}
					disabled={isActionDisabled}
				/>
			</div>

			<div className="bp-address-form">
				<fieldset className="bp-radio-fieldset">
					<legend className="detail-label">Address Type</legend>

					<div className="bp-radio-group">
						{addressTypes.map((addressType) => (
							<FormInput
								key={addressType}
								type="radio"
								label={addressType}
								name="addressType"
								value={addressType}
								checked={form.label === addressType}
								onChange={() => onChange("label", addressType)}
							/>
						))}
					</div>
				</fieldset>

				<div className="bp-address-field">
					<TextareaInput
						name="address"
						label="Address"
						value={form.address}
						onChange={(e) => onChange("address", e.target.value)}
						placeholder="Flat / Building / Street / Area"
						rows={4}
						maxLength={100}
						className="bigtextArea"
					/>
				</div>
			</div>
		</Card>
	);
};

export default BPAddressFormCard;
