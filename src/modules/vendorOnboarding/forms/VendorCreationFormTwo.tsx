import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";
import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	FileCheck2,
	Landmark,
	RefreshCcw,
	ShieldCheck,
} from "lucide-react";
import type {
	VendorCreationFormTwoValues,
	VendorFormErrors,
} from "../types/vendorOnboarding.types";

type VendorFormMode = "edit" | "view";

type VendorCreationFormTwoProps = {
	mode?: VendorFormMode;
	values?: VendorCreationFormTwoValues;
	onChange?: <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => void;
	onBack?: () => void;
	onNext?: () => void;
	errors?: VendorFormErrors<VendorCreationFormTwoValues>;
	loading?: boolean;
};

type SelectOption = {
	label: string;
	value: string;
};

const toSelectOptions = (values: string[]): SelectOption[] =>
	values.map((value) => ({
		label: value,
		value,
	}));

const getSelectedOption = (
	options: SelectOption[],
	value?: string,
): SelectOption | null =>
	options.find((option) => option.value === value) ?? null;

const getDisplayValue = (value?: string): string =>
	value && value.trim().length > 0 ? value : "--";

const tdsOptions = toSelectOptions([
	"194J - Professional Fee",
	"194A - Interest",
	"194C - Contractors",
	"194I - Rent",
	"194H - Commission",
	"Not Applicable",
]);

const vendorCategoryOptions = toSelectOptions([
	"Material",
	"Parts",
	"Service",
	"Capital",
	"Not Applicable",
]);

const materialTypeOptions = toSelectOptions([
	"1 - Direct",
	"2 - Indirect",
	"Not Applicable",
]);

const materialSubTypeOptions = toSelectOptions([
	"1 - Proprietary",
	"2 - Non-Proprietary",
	"Not Applicable",
]);

const yesNoOptions = toSelectOptions(["Yes", "No"]);

type VendorDetailValueProps = {
	label: string;
	value?: string;
	required?: boolean;
};

const VendorDetailValue = ({
	label,
	value,
	required = false,
}: VendorDetailValueProps) => {
	return (
		<div className="vendor-detail-field">
			<div className="vendor-detail-label">
				{label}
				{required ? (
					<span className="vendor-detail-required" aria-hidden="true">
						*
					</span>
				) : null}
				:
			</div>
			<div className="vendor-detail-value">{getDisplayValue(value)}</div>
		</div>
	);
};

const VendorCreationFormTwo = ({
	mode = "edit",
	values = {},
	onChange,
	onBack,
	onNext,
	errors = {},
	loading = false,
}: VendorCreationFormTwoProps) => {
	const isViewMode = mode === "view";

	return (
		<form className="vendor-onboarding-form">
			<FormHeader title="Contact Information" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue label="Mobile" value={values.mobile} required />
						<VendorDetailValue label="E-mail" value={values.email} required />
					</>
				) : (
					<>
						<FormInput
							name="mobile"
							label="Mobile"
							value={values.mobile ?? ""}
							required
							error={errors.mobile}
							helperText="Vendor mobile number."
							onChange={(event) => onChange?.("mobile", event.target.value)}
						/>

						<FormInput
							name="email"
							label="E-mail"
							value={values.email ?? ""}
							required
							error={errors.email}
							helperText="Vendor email address."
							onChange={(event) => onChange?.("email", event.target.value)}
						/>
					</>
				)}
			</div>

			<FormHeader title="Bank Details" Icon={Landmark} />

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue label="Bank" value={values.bank} required />
						<VendorDetailValue label="Branch" value={values.branch} required />
						<VendorDetailValue
							label="IFSC Code"
							value={values.ifscCode}
							required
						/>
						<VendorDetailValue label="Address" value={values.bankAddress} />
						<VendorDetailValue
							label="A/C No."
							value={values.accountNumber}
							required
						/>
						<VendorDetailValue
							label="Payment Term"
							value={values.paymentTerm}
						/>
					</>
				) : (
					<>
						<FormInput
							name="bank"
							label="Bank"
							value={values.bank ?? ""}
							required
							error={errors.bank}
							helperText="Bank name."
							onChange={(event) => onChange?.("bank", event.target.value)}
						/>

						<FormInput
							name="branch"
							label="Branch"
							value={values.branch ?? ""}
							required
							error={errors.branch}
							helperText="Bank branch."
							onChange={(event) => onChange?.("branch", event.target.value)}
						/>

						<FormInput
							name="ifscCode"
							label="IFSC Code"
							value={values.ifscCode ?? ""}
							required
							error={errors.ifscCode}
							helperText="Bank IFSC code."
							onChange={(event) => onChange?.("ifscCode", event.target.value)}
						/>

						<FormInput
							name="bankAddress"
							label="Address"
							value={values.bankAddress ?? ""}
							error={errors.bankAddress}
							helperText="Bank branch address."
							onChange={(event) =>
								onChange?.("bankAddress", event.target.value)
							}
						/>

						<FormInput
							name="accountNumber"
							label="A/C No."
							value={values.accountNumber ?? ""}
							required
							error={errors.accountNumber}
							helperText="Vendor bank account number."
							onChange={(event) =>
								onChange?.("accountNumber", event.target.value)
							}
						/>

						<FormInput
							name="paymentTerm"
							label="Payment Term"
							value={values.paymentTerm ?? ""}
							error={errors.paymentTerm}
							helperText="Payment terms applicable to this vendor."
							onChange={(event) =>
								onChange?.("paymentTerm", event.target.value)
							}
						/>
					</>
				)}
			</div>

			<FormHeader title="Tax & Vendor Classification" Icon={Banknote} />

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue label="TDS" value={values.tds} />
						<VendorDetailValue label="GSTIN" value={values.gstin} required />
						<VendorDetailValue label="PAN" value={values.pan} required />
						<VendorDetailValue
							label="Entity Reg. No."
							value={values.entityRegistrationNumber}
						/>
						<VendorDetailValue
							label="Vendor Category"
							value={values.vendorCategory}
						/>
						<VendorDetailValue
							label="Material Type"
							value={values.materialType}
						/>
						<VendorDetailValue
							label="Material Sub Type"
							value={values.materialSubType}
						/>
					</>
				) : (
					<>
						<SelectInput
							name="tds"
							label="TDS"
							placeholder="Select TDS"
							options={tdsOptions}
							value={getSelectedOption(tdsOptions, values.tds)}
							error={errors.tds}
							helperText="Select the applicable TDS section."
							onChange={(option) => onChange?.("tds", option?.value ?? "")}
						/>

						<FormInput
							name="gstin"
							label="GSTIN"
							value={values.gstin ?? ""}
							required
							error={errors.gstin}
							helperText="GST identification number."
							onChange={(event) => onChange?.("gstin", event.target.value)}
						/>

						<FormInput
							name="pan"
							label="PAN"
							value={values.pan ?? ""}
							required
							error={errors.pan}
							helperText="Permanent account number."
							onChange={(event) => onChange?.("pan", event.target.value)}
						/>

						<FormInput
							name="entityRegistrationNumber"
							label="Entity Reg. No."
							value={values.entityRegistrationNumber ?? ""}
							error={errors.entityRegistrationNumber}
							helperText="Entity registration number, if applicable."
							onChange={(event) =>
								onChange?.("entityRegistrationNumber", event.target.value)
							}
						/>

						<SelectInput
							name="vendorCategory"
							label="Vendor Category"
							placeholder="Select vendor category"
							options={vendorCategoryOptions}
							value={getSelectedOption(
								vendorCategoryOptions,
								values.vendorCategory,
							)}
							error={errors.vendorCategory}
							helperText="Select the category applicable to this vendor."
							onChange={(option) =>
								onChange?.("vendorCategory", option?.value ?? "")
							}
						/>

						<SelectInput
							name="materialType"
							label="Material Type"
							placeholder="Select material type"
							options={materialTypeOptions}
							value={getSelectedOption(
								materialTypeOptions,
								values.materialType,
							)}
							error={errors.materialType}
							helperText="Select direct, indirect, or not applicable."
							onChange={(option) =>
								onChange?.("materialType", option?.value ?? "")
							}
						/>

						<SelectInput
							name="materialSubType"
							label="Material Sub Type"
							placeholder="Select material sub type"
							options={materialSubTypeOptions}
							value={getSelectedOption(
								materialSubTypeOptions,
								values.materialSubType,
							)}
							error={errors.materialSubType}
							helperText="Select proprietary, non-proprietary, or not applicable."
							onChange={(option) =>
								onChange?.("materialSubType", option?.value ?? "")
							}
						/>
					</>
				)}
			</div>

			<FormHeader title="Compliance Declarations" Icon={ShieldCheck} />

			<div className="vendor-onboarding-form-grid">
				{isViewMode ? (
					<>
						<VendorDetailValue
							label="Vendor Self Assessment Form Obtained?"
							value={values.vendorSelfAssessmentObtained}
						/>
						<VendorDetailValue
							label="Non-Disclosure Undertaking Obtained?"
							value={values.ndaObtained}
						/>
						<VendorDetailValue
							label="General Purpose Agreement Obtained?"
							value={values.gpaObtained}
						/>
						<VendorDetailValue
							label="Is it Related Party to THCM?"
							value={values.relatedPartyToThcm}
						/>
						<VendorDetailValue
							label="Vendor Audit Report Prepared?"
							value={values.vendorAuditReportPrepared}
						/>
						<VendorDetailValue label="Remarks" value={values.remarks} />
						<VendorDetailValue
							label="Reason for Onboarding of Vendor"
							value={values.reasonForOnboarding}
							required
						/>
					</>
				) : (
					<>
						<SelectInput
							name="vendorSelfAssessmentObtained"
							label="Vendor Self Assessment Form Obtained?"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(
								yesNoOptions,
								values.vendorSelfAssessmentObtained,
							)}
							error={errors.vendorSelfAssessmentObtained}
							helperText="Confirm whether vendor self assessment form is obtained."
							onChange={(option) =>
								onChange?.("vendorSelfAssessmentObtained", option?.value ?? "")
							}
						/>

						<SelectInput
							name="ndaObtained"
							label="Non-Disclosure Undertaking Obtained?"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(yesNoOptions, values.ndaObtained)}
							error={errors.ndaObtained}
							helperText="Confirm whether NDA is obtained."
							onChange={(option) =>
								onChange?.("ndaObtained", option?.value ?? "")
							}
						/>

						<SelectInput
							name="gpaObtained"
							label="General Purpose Agreement Obtained?"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(yesNoOptions, values.gpaObtained)}
							error={errors.gpaObtained}
							helperText="Confirm whether GPA is obtained."
							onChange={(option) =>
								onChange?.("gpaObtained", option?.value ?? "")
							}
						/>

						<SelectInput
							name="relatedPartyToThcm"
							label="Is it Related Party to THCM?"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(yesNoOptions, values.relatedPartyToThcm)}
							error={errors.relatedPartyToThcm}
							helperText="Confirm whether vendor is a related party to THCM."
							onChange={(option) =>
								onChange?.("relatedPartyToThcm", option?.value ?? "")
							}
						/>

						<SelectInput
							name="vendorAuditReportPrepared"
							label="Vendor Audit Report Prepared?"
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(
								yesNoOptions,
								values.vendorAuditReportPrepared,
							)}
							error={errors.vendorAuditReportPrepared}
							helperText="Confirm whether vendor audit report is prepared."
							onChange={(option) =>
								onChange?.("vendorAuditReportPrepared", option?.value ?? "")
							}
						/>

						<FormInput
							name="remarks"
							label="Remarks"
							value={values.remarks ?? ""}
							error={errors.remarks}
							helperText="Additional remarks."
							onChange={(event) => onChange?.("remarks", event.target.value)}
						/>

						<FormInput
							name="reasonForOnboarding"
							label="Reason for Onboarding of Vendor"
							value={values.reasonForOnboarding ?? ""}
							required
							error={errors.reasonForOnboarding}
							helperText="Business justification for onboarding."
							onChange={(event) =>
								onChange?.("reasonForOnboarding", event.target.value)
							}
						/>
					</>
				)}
			</div>

			<FormHeader title="Proposed By" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="proposedByName"
					label="Name"
					value={values.proposedByName}
					error={errors.proposedByName}
					helperText="Proposer name."
					onChange={(value) => onChange?.("proposedByName", value)}
				/>

				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="proposedByDesignation"
					label="Designation"
					value={values.proposedByDesignation}
					error={errors.proposedByDesignation}
					helperText="Proposer designation."
					onChange={(value) => onChange?.("proposedByDesignation", value)}
				/>

				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="proposedDate"
					label="Proposed Date"
					value={values.proposedDate}
					error={errors.proposedDate}
					helperText="Date of proposal."
					onChange={(value) => onChange?.("proposedDate", value)}
				/>
			</div>

			<FormHeader title="Approved By" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="approvedByName"
					label="Name"
					value={values.approvedByName}
					error={errors.approvedByName}
					helperText="Approver name."
					onChange={(value) => onChange?.("approvedByName", value)}
				/>

				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="approvedByDesignation"
					label="Designation"
					value={values.approvedByDesignation}
					error={errors.approvedByDesignation}
					helperText="Approver designation."
					onChange={(value) => onChange?.("approvedByDesignation", value)}
				/>

				<VendorDetailOrInput
					isViewMode={isViewMode}
					name="approvalDate"
					label="Approval Date"
					value={values.approvalDate}
					error={errors.approvalDate}
					helperText="Date of approval."
					onChange={(value) => onChange?.("approvalDate", value)}
				/>
			</div>

			<FormHeader title="Enclosures" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				{[
					["gstCertificate", "GST Certificate"],
					["panNumber", "PAN Number"],
					["bankCancelledCheque", "Bank Cancelled Cheque"],
					[
						"certificateOfIncorporation",
						"Certificate of Incorporation / Registration",
					],
					["msmeCertificate", "MSME Certificate"],
					["passportPhotograph", "Passport Photograph"],
				].map(([name, label]) =>
					isViewMode ? (
						<VendorDetailValue
							key={name}
							label={label}
							value={values[name as keyof VendorCreationFormTwoValues]}
						/>
					) : (
						<SelectInput
							key={name}
							name={name}
							label={label}
							placeholder="Select option"
							options={yesNoOptions}
							value={getSelectedOption(
								yesNoOptions,
								values[name as keyof VendorCreationFormTwoValues],
							)}
							error={errors[name as keyof VendorCreationFormTwoValues]}
							helperText="Confirm enclosure availability."
							onChange={(option) =>
								onChange?.(
									name as keyof VendorCreationFormTwoValues,
									option?.value ?? "",
								)
							}
						/>
					),
				)}
			</div>

			{isViewMode ? null : (
				<div className="vendor-onboarding-form-actions">
					<Button
						type="button"
						text="Back"
						size="sm"
						Icon={ArrowLeft}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						onClick={onBack}
						disabled={loading}
					/>

					<div className="vendor-onboarding-form-actions-end">
						<Button
							type="button"
							text="Reset"
							Icon={RefreshCcw}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={loading}
						/>

						<Button
							type="button"
							text={loading ? "Saving..." : "Save & Proceed"}
							size="sm"
							Icon={ArrowRight}
							iconPosition="right"
							appearance="standard"
							variant="brand"
							onClick={onNext}
							disabled={loading}
						/>
					</div>
				</div>
			)}
		</form>
	);
};

type VendorDetailOrInputProps = {
	isViewMode: boolean;
	name: string;
	label: string;
	value?: string;
	helperText?: string;
	error?: string;
	onChange: (value: string) => void;
};

const VendorDetailOrInput = ({
	isViewMode,
	name,
	label,
	value,
	helperText,
	error,
	onChange,
}: VendorDetailOrInputProps) => {
	if (isViewMode) {
		return <VendorDetailValue label={label} value={value} />;
	}

	return (
		<FormInput
			name={name}
			label={label}
			value={value ?? ""}
			error={error}
			helperText={helperText}
			onChange={(event) => onChange(event.target.value)}
		/>
	);
};

export default VendorCreationFormTwo;
export type { VendorCreationFormTwoValues };
