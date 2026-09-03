import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";

import type {
	BusinessPartnerEntityType,
	BusinessPartnerFormState,
	BusinessPartnerOfficeType,
	BusinessPartnerType,
} from "../utils/bp.types";

type BPCreateFormProps = {
	form: BusinessPartnerFormState;
	isEditMode: boolean;
	isSaving: boolean;
	canSubmit: boolean;
	error?: string | null;

	onChange: <K extends keyof BusinessPartnerFormState>(
		key: K,
		value: BusinessPartnerFormState[K],
	) => void;

	onSubmit: () => void;
	onCancel: () => void;
};

const OFFICE_TYPE_OPTIONS = [
	{ label: "Head Office", value: "HEAD_OFFICE" },
	{ label: "Branch Office", value: "BRANCH_OFFICE" },
];

const BUSINESS_PARTNER_TYPE_OPTIONS = [
	{ label: "Dealer", value: "DEALER" },
	{ label: "Customer", value: "CUSTOMER" },
	{ label: "Employee", value: "EMPLOYEE" },
];

const ENTITY_TYPE_OPTIONS = [
	{ label: "Company", value: "COMPANY" },
	{ label: "Partnership", value: "PARTNERSHIP" },
	{ label: "Proprietorship", value: "PROPRIETORSHIP" },
	{ label: "Individual", value: "INDIVIDUAL" },
	{ label: "Other", value: "OTHER" },
];

const BPCreateForm = ({
	form,
	isEditMode,
	isSaving,
	canSubmit,
	error,
	onChange,
	onSubmit,
	onCancel,
}: BPCreateFormProps) => {
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
		>
			<div className="bp-master-form">
				<Card title="Basic Information">
					<div className="bp-master-form-grid">
						<FormInput
							name="internalId"
							label="Internal ID"
							value={form.internalId}
							onChange={(event) => onChange("internalId", event.target.value)}
							required
						/>

						<FormInput
							name="bpName"
							label="Business Partner Name"
							value={form.bpName}
							onChange={(event) => onChange("bpName", event.target.value)}
							required
						/>

						<FormInput
							name="bpShortName"
							label="Short Name"
							value={form.bpShortName}
							onChange={(event) => onChange("bpShortName", event.target.value)}
						/>

						<FormInput
							name="legalTradeName"
							label="Legal Trade Name"
							value={form.legalTradeName}
							onChange={(event) =>
								onChange("legalTradeName", event.target.value)
							}
						/>

						<SelectInput
							name="bpType"
							label="User Type"
							value={
								BUSINESS_PARTNER_TYPE_OPTIONS.find(
									(option) => option.value === form.bpType,
								) ?? null
							}
							options={BUSINESS_PARTNER_TYPE_OPTIONS}
							onChange={(selectedOption) =>
								onChange(
									"bpType",
									selectedOption
										? (selectedOption.value as BusinessPartnerType)
										: "",
								)
							}
							required
						/>

						<SelectInput
							name="officeType"
							label="Office Type"
							value={
								OFFICE_TYPE_OPTIONS.find(
									(option) => option.value === form.officeType,
								) ?? null
							}
							options={OFFICE_TYPE_OPTIONS}
							onChange={(selectedOption) =>
								onChange(
									"officeType",
									selectedOption
										? (selectedOption.value as BusinessPartnerOfficeType)
										: "",
								)
							}
							required
						/>

						<SelectInput
							name="entityType"
							label="Entity Type"
							value={
								ENTITY_TYPE_OPTIONS.find(
									(option) => option.value === form.entityType,
								) ?? null
							}
							options={ENTITY_TYPE_OPTIONS}
							onChange={(selectedOption) =>
								onChange(
									"entityType",
									selectedOption
										? (selectedOption.value as BusinessPartnerEntityType)
										: "",
								)
							}
						/>

						<FormInput
							name="joinedOn"
							label="Joined On"
							type="date"
							value={form.joinedOn}
							onChange={(event) => onChange("joinedOn", event.target.value)}
						/>
					</div>
				</Card>

				<Card title="Business Identifiers">
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
				</Card>

				<Card title="Tax Information">
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
				</Card>

				<Card title="Settings">
					<div className="bp-master-form-checks">
						<label>
							<input
								type="checkbox"
								checked={form.isKeyAccount}
								onChange={(event) =>
									onChange("isKeyAccount", event.target.checked)
								}
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
				</Card>

				{error ? (
					<p className="bp-master-form-error" role="alert">
						{error}
					</p>
				) : null}

				<div className="bp-master-form-actions">
					<Button
						type="button"
						text="Cancel"
						variant="secondary"
						onClick={onCancel}
						disabled={isSaving}
					/>

					<Button
						type="submit"
						text={
							isSaving
								? "Saving..."
								: isEditMode
									? "Update Business Partner"
									: "Create Business Partner"
						}
						variant="brand"
						disabled={!canSubmit || isSaving}
					/>
				</div>
			</div>
		</form>
	);
};

export default BPCreateForm;
