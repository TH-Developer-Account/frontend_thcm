import FormInput from "../../../../components/forms/FormInput";

import type {
	BPContactData,
	BusinessPartnerFormState,
	InfoField,
} from "../utils/bp.types";

type BPContactProps = {
	data?: BPContactData;
	onNavigateTab?: (tab: string) => void;
};

type FormChangeHandler = <K extends keyof BusinessPartnerFormState>(
	key: K,
	value: BusinessPartnerFormState[K],
) => void;

type BPContactFormProps = {
	form: BusinessPartnerFormState;
	onChange: FormChangeHandler;
};

const FALLBACK_VALUE = "--";

const BPContact = ({ data, onNavigateTab }: BPContactProps) => {
	const fields: InfoField[] = [
		{
			label: "Name",
			value: data?.name,
			isLink: true,
			tab: "Organization",
		},
		{
			label: "Email",
			value: data?.email,
		},
		{
			label: "Fax",
			value: data?.fax,
		},
		{
			label: "Mobile Number",
			value: data?.mobile_number,
		},
		{
			label: "Phone",
			value: data?.phone,
		},
		{
			label: "Main Contact Person",
			value: data?.mainContactPerson,
			isLink: true,
			tab: "People",
		},
		{
			label: "Main Contact Number",
			value: data?.mainContactNumber,
		},
		{
			label: "State",
			value: data?.state,
		},
		{
			label: "City",
			value: data?.city,
		},
		{
			label: "Country",
			value: data?.country,
		},
	];

	return (
		<div className="bp-gen-content">
			<div className="detail-section">
				<div className="detail-grid">
					{fields.map((field) => (
						<div key={field.label} className="detail-row">
							<p className="detail-label">{field.label}</p>

							<p className="detail-value">
								{field.isLink && field.value ? (
									<button
										type="button"
										onClick={() => {
											if (field.tab) {
												onNavigateTab?.(field.tab);
											}
										}}
										className="detail-link"
									>
										{field.value}
									</button>
								) : (
									field.value || FALLBACK_VALUE
								)}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

/**
 * Editable Contact Information form: mobile, email, fax, telephone.
 * Main Contact name/number fields are commented out for now — they'll
 * likely be sourced from the People tab's main-contact selection instead
 * of free text, so leaving them out until that's decided.
 */
export const BPContactForm = ({ form, onChange }: BPContactFormProps) => (
	<section
		className="bp-create-form-section"
		aria-labelledby="contact-information-heading"
	>
		<h3 id="contact-information-heading" className="sr-only">
			Contact Information
		</h3>
		<div className="bp-master-form-grid">
			<FormInput
				name="mobileNumber"
				label="Mobile Number"
				value={form.mobileNumber}
				onChange={(event) => onChange("mobileNumber", event.target.value)}
			/>
			<FormInput
				name="email"
				label="Email"
				type="email"
				value={form.email}
				onChange={(event) => onChange("email", event.target.value)}
			/>
			<FormInput
				name="telephone"
				label="Telephone"
				value={form.telephone}
				onChange={(event) => onChange("telephone", event.target.value)}
			/>
			<FormInput
				name="fax"
				label="Fax"
				value={form.fax}
				onChange={(event) => onChange("fax", event.target.value)}
			/>
			{/* <FormInput
				name="mainContactName"
				label="Main Contact Person"
				value={form.mainContactName}
				onChange={(event) => onChange("mainContactName", event.target.value)}
			/>
			<FormInput
				name="mainContactNumber"
				label="Main Contact Number"
				value={form.mainContactNumber}
				onChange={(event) =>
					onChange("mainContactNumber", event.target.value)
				}
			/> */}
		</div>
	</section>
);

export default BPContact;
