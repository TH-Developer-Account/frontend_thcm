import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";

import type { BusinessPartnerFieldErrors } from "../utils/businessPartner.schema";

import type {
	BusinessPartnerEntityType,
	BusinessPartnerFormState,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

type FormChangeHandler = <K extends keyof BusinessPartnerFormState>(
	key: K,
	value: BusinessPartnerFormState[K],
) => void;

type BPOrganizationFormProps = {
	form: BusinessPartnerFormState;
	fieldErrors?: BusinessPartnerFieldErrors;
	onChange: FormChangeHandler;
};

const OFFICE_TYPE_OPTIONS = [
	{
		label: "Head Office",
		value: "HEAD_OFFICE",
	},
	{
		label: "Branch Office",
		value: "BRANCH_OFFICE",
	},
];

const BUSINESS_PARTNER_TYPE_OPTIONS = [
	{
		label: "Dealer",
		value: "DEALER",
	},
	{
		label: "Customer",
		value: "CUSTOMER",
	},
	{
		label: "Employee",
		value: "EMPLOYEE",
	},
];

const ENTITY_TYPE_OPTIONS = [
	{
		label: "Company",
		value: "COMPANY",
	},
	{
		label: "Partnership",
		value: "PARTNERSHIP",
	},
	{
		label: "Proprietorship",
		value: "PROPRIETORSHIP",
	},
	{
		label: "Individual",
		value: "INDIVIDUAL",
	},
	{
		label: "Other",
		value: "OTHER",
	},
];

export const BPOrganizationForm = ({
	form,
	fieldErrors = {},
	onChange,
}: BPOrganizationFormProps) => (
	<div className="bp-create-form-sections">
		<section
			className="bp-create-form-section"
			aria-labelledby="basic-information-heading"
		>
			<div className="bp-create-form-heading">
				<h3 id="basic-information-heading">Basic Information</h3>
			</div>

			<div className="bp-master-form-grid">
				<FormInput
					name="internalId"
					label="Internal ID"
					value={form.internalId}
					onChange={(event) => onChange("internalId", event.target.value)}
					error={fieldErrors.internalId}
				/>

				<FormInput
					name="bpName"
					label="Business Partner Name"
					value={form.bpName}
					onChange={(event) => onChange("bpName", event.target.value)}
					error={fieldErrors.bpName}
				/>

				<FormInput
					name="bpShortName"
					label="Short Name"
					value={form.bpShortName}
					onChange={(event) => onChange("bpShortName", event.target.value)}
					error={fieldErrors.bpShortName}
				/>

				<FormInput
					name="legalTradeName"
					label="Legal Trade Name"
					value={form.legalTradeName}
					onChange={(event) => onChange("legalTradeName", event.target.value)}
					error={fieldErrors.legalTradeName}
				/>

				<SelectInput
					name="officeType"
					label="Office Type"
					options={OFFICE_TYPE_OPTIONS}
					value={
						OFFICE_TYPE_OPTIONS.find(
							(option) => option.value === form.officeType,
						) ?? null
					}
					onChange={(option) =>
						onChange(
							"officeType",
							(option?.value ?? "") as BusinessPartnerOfficeType | "",
						)
					}
					error={fieldErrors.officeType}
				/>

				<SelectInput
					name="bpType"
					label="Business Partner Type"
					options={BUSINESS_PARTNER_TYPE_OPTIONS}
					value={
						BUSINESS_PARTNER_TYPE_OPTIONS.find(
							(option) => option.value === form.bpType,
						) ?? null
					}
					onChange={(option) =>
						onChange(
							"bpType",
							(option?.value ?? "") as BusinessPartnerType | "",
						)
					}
					error={fieldErrors.bpType}
				/>

				<SelectInput
					name="entityType"
					label="Entity Type"
					options={ENTITY_TYPE_OPTIONS}
					value={
						ENTITY_TYPE_OPTIONS.find(
							(option) => option.value === form.entityType,
						) ?? null
					}
					onChange={(option) =>
						onChange(
							"entityType",
							(option?.value ?? "") as BusinessPartnerEntityType | "",
						)
					}
					error={fieldErrors.entityType}
				/>

				<FormInput
					name="joinedOn"
					label="Joined On"
					type="date"
					value={form.joinedOn}
					onChange={(event) => onChange("joinedOn", event.target.value)}
					error={fieldErrors.joinedOn}
				/>
			</div>
		</section>

		<section
			className="bp-create-form-section"
			aria-labelledby="business-identifiers-heading"
		>
			<div className="bp-create-form-heading">
				<h3 id="business-identifiers-heading">Business Identifiers</h3>
			</div>

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
					disabled={
						form.officeType === "BRANCH_OFFICE" && Boolean(form.parentId)
					}
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

export default BPOrganizationForm;
