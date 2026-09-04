import FormInput from "../../../../components/forms/FormInput";

import type {
	BPOrganizationData,
	BusinessPartnerFormState,
	InfoField,
} from "../utils/bp.types";

type FormChangeHandler = <K extends keyof BusinessPartnerFormState>(
	key: K,
	value: BusinessPartnerFormState[K],
) => void;

type BPOrganizationViewProps = { data?: BPOrganizationData };

type BPOrganizationFormProps = {
	form: BusinessPartnerFormState;
	onChange: FormChangeHandler;
};

const FALLBACK_VALUE = "--";

export const BPOrganizationView = ({ data }: BPOrganizationViewProps) => {
	const fields: InfoField[] = [
		{ label: "Organization Name", value: data?.orgName },
		{ label: "Organization Code", value: data?.bpCode },
		{ label: "Status", value: data?.status },
		{ label: "Joined On", value: data?.joinedOn },
		{ label: "Branches", value: data?.branches },
		{ label: "Website", value: data?.website },
		{ label: "GST No", value: data?.gstNo },
		{ label: "PAN No", value: data?.panNo },
		{ label: "Registration No", value: data?.registrationNo },
		{ label: "Zone", value: data?.zone },
		{ label: "Segment", value: data?.segment },
		{ label: "Category", value: data?.category },
		{ label: "Partner Type", value: data?.partnerType },
	];

	return (
		<div className="bp-gen-content">
			<div className="detail-section">
				<div className="detail-grid">
					{fields.map(({ label, value }) => (
						<div key={label} className="detail-row">
							<p className="detail-label">{label}</p>
							<p className="detail-value">{value || FALLBACK_VALUE}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export const BPOrganizationForm = ({
	form,
	onChange,
}: BPOrganizationFormProps) => (
	<div className="bp-create-form-sections">
		<section
			className="bp-create-form-section"
			aria-labelledby="business-identifiers-heading"
		>
			{/* <div className="bp-create-form-heading">
				<h3 id="business-identifiers-heading">Business Identifiers</h3>
				<p>Enter system and vendor identification numbers.</p>
			</div> */}
			<div className="bp-master-form-grid">
				<FormInput
					name="bpId"
					label="BP ID"
					value={form.bpId}
					onChange={(event) => onChange("bpId", event.target.value)}
				/>
				<FormInput
					name="vendorId"
					label="Vendor ID"
					value={form.vendorId}
					onChange={(event) => onChange("vendorId", event.target.value)}
				/>
				<FormInput
					name="vendorCode"
					label="Vendor Code"
					value={form.vendorCode}
					onChange={(event) => onChange("vendorCode", event.target.value)}
				/>
				<FormInput
					name="s4Id"
					label="S4 ID"
					value={form.s4Id}
					onChange={(event) => onChange("s4Id", event.target.value)}
				/>
				<FormInput
					name="bydId"
					label="BYD ID"
					value={form.bydId}
					onChange={(event) => onChange("bydId", event.target.value)}
				/>
				<FormInput
					name="c4cId"
					label="C4C ID"
					value={form.c4cId}
					onChange={(event) => onChange("c4cId", event.target.value)}
				/>
				<FormInput
					name="parentId"
					label="Parent Business Partner ID"
					value={form.parentId}
					onChange={(event) => onChange("parentId", event.target.value)}
				/>
			</div>
		</section>

		<section
			className="bp-create-form-section"
			aria-labelledby="tax-information-heading"
		>
			<div className="bp-create-form-heading">
				<h3 id="tax-information-heading">Tax Information</h3>
			</div>
			<div className="bp-master-form-grid">
				<FormInput
					name="gst"
					label="GST Number"
					value={form.gst}
					onChange={(event) =>
						onChange("gst", event.target.value.toUpperCase())
					}
				/>
				<FormInput
					name="panNumber"
					label="PAN Number"
					value={form.panNumber}
					onChange={(event) =>
						onChange("panNumber", event.target.value.toUpperCase())
					}
				/>
			</div>
		</section>

		<section
			className="bp-create-form-section"
			aria-labelledby="settings-heading"
		>
			<div className="bp-create-form-heading">
				<h3 id="settings-heading">Settings</h3>
			</div>
			<div className="bp-master-form-checks">
				<label>
					<input
						type="checkbox"
						checked={form.isKeyAccount}
						onChange={(event) => onChange("isKeyAccount", event.target.checked)}
					/>
					Key account
				</label>
				<label>
					<input
						type="checkbox"
						checked={form.isActive}
						onChange={(event) => onChange("isActive", event.target.checked)}
					/>
					Active
				</label>
			</div>
		</section>
	</div>
);

export default BPOrganizationView;
