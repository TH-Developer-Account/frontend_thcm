import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";
import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	FileCheck2,
	RefreshCcw,
	ShieldCheck,
} from "lucide-react";
import type {
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorFormMode,
} from "../types/vendorOnboarding.types";
import TextareaInput from "../../../components/forms/TextareaInput";

export type VendorCreationFormTwoProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;
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

const vendorTypeOptions = toSelectOptions([
	"PO Based",
	"Non PO Based",
	"Not Applicable",
]);

const companyCodeOptions = toSelectOptions([
	"0050 - JSR",
	"0070 - KGP",
	"0080 - BLR",
	"0091 - DWD",
	"Extension",
]);

const purchaseOrgOptions = toSelectOptions([
	"P501 - Direct Purchase",
	"P502 - Indirect Purchase",
	"P503 - Capital Purchase",
	"P504 - External Purchase",
	"P505 - Stock Transport",
	"P506 - Spare Part Purchase",
	"Not Applicable",
]);

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
	canEdit = true,
	values = {},
	onChange,
	onBack,
	onNext,
	errors = {},
	loading = false,
}: VendorCreationFormTwoProps) => {
	const isReadOnly = mode === "view" || !canEdit;

	const renderInput = <K extends keyof VendorCreationFormTwoValues>({
		name,
		label,
		required,
		helperText,
	}: {
		name: K;
		label: string;
		required?: boolean;
		helperText?: string;
	}) => {
		if (isReadOnly) {
			return (
				<VendorDetailValue
					label={label}
					value={values[name]}
					required={required}
				/>
			);
		}

		return (
			<FormInput
				name={String(name)}
				label={label}
				value={values[name] ?? ""}
				required={required}
				error={errors[name]}
				helperText={helperText}
				onChange={(event) => onChange?.(name, event.target.value)}
			/>
		);
	};

	const renderSelect = <K extends keyof VendorCreationFormTwoValues>({
		name,
		label,
		options,
		required,
		helperText,
		placeholder = "Select option",
	}: {
		name: K;
		label: string;
		options: SelectOption[];
		required?: boolean;
		helperText?: string;
		placeholder?: string;
	}) => {
		if (isReadOnly) {
			return (
				<VendorDetailValue
					label={label}
					value={values[name]}
					required={required}
				/>
			);
		}

		return (
			<SelectInput
				name={String(name)}
				label={label}
				placeholder={placeholder}
				options={options}
				value={getSelectedOption(options, values[name])}
				required={required}
				error={errors[name]}
				helperText={helperText}
				onChange={(option) => onChange?.(name, option?.value ?? "")}
			/>
		);
	};

	return (
		<form className="vendor-onboarding-form">
			<FormHeader title="THCM Vendor Master Details" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				{renderInput({
					name: "vendorCode",
					label: "Vendor Code",
					helperText: "Enter only if this is an existing vendor.",
				})}

				{renderSelect({
					name: "vendorType",
					label: "Vendor Type",
					options: vendorTypeOptions,
					required: true,
					placeholder: "Select vendor type",
					helperText:
						"Choose whether the vendor is PO based, non-PO based, or not applicable.",
				})}

				{renderSelect({
					name: "companyCode",
					label: "Company Code",
					options: companyCodeOptions,
					required: true,
					placeholder: "Select company code",
					helperText: "Select the applicable THCM company code.",
				})}

				{renderSelect({
					name: "purchaseOrg",
					label: "Purchase Org",
					options: purchaseOrgOptions,
					required: true,
					placeholder: "Select purchase organization",
					helperText:
						"Select the purchase organization applicable to this vendor.",
				})}
			</div>

			<FormHeader title="Finance & Tax Classification" Icon={Banknote} />

			<div className="vendor-onboarding-form-grid">
				{renderInput({
					name: "paymentTerm",
					label: "Payment Term",
					helperText: "Payment terms applicable to this vendor.",
				})}

				{renderSelect({
					name: "tds",
					label: "TDS",
					options: tdsOptions,
					placeholder: "Select TDS",
					helperText: "Select the applicable TDS section.",
				})}

				{renderSelect({
					name: "vendorCategory",
					label: "Vendor Category",
					options: vendorCategoryOptions,
					placeholder: "Select vendor category",
					helperText: "Select the category applicable to this vendor.",
				})}

				{renderSelect({
					name: "materialType",
					label: "Material Type",
					options: materialTypeOptions,
					placeholder: "Select material type",
					helperText: "Select direct, indirect, or not applicable.",
				})}

				{renderSelect({
					name: "materialSubType",
					label: "Material Sub Type",
					options: materialSubTypeOptions,
					placeholder: "Select material sub type",
					helperText: "Select proprietary, non-proprietary, or not applicable.",
				})}
			</div>

			<FormHeader title="Compliance Declarations" Icon={ShieldCheck} />

			<div className="vendor-onboarding-form-grid">
				{renderSelect({
					name: "vendorSelfAssessmentObtained",
					label: "Vendor Self Assessment Form Obtained?",
					options: yesNoOptions,
					helperText:
						"Confirm whether vendor self assessment form is obtained.",
				})}

				{renderSelect({
					name: "ndaObtained",
					label: "Non-Disclosure Undertaking Obtained?",
					options: yesNoOptions,
					helperText: "Confirm whether NDA is obtained.",
				})}

				{renderSelect({
					name: "gpaObtained",
					label: "General Purpose Agreement Obtained?",
					options: yesNoOptions,
					helperText: "Confirm whether GPA is obtained.",
				})}

				{renderSelect({
					name: "relatedPartyToThcm",
					label: "Is it Related Party to THCM?",
					options: yesNoOptions,
					helperText: "Confirm whether vendor is a related party to THCM.",
				})}

				{renderSelect({
					name: "vendorAuditReportPrepared",
					label: "Vendor Audit Report Prepared?",
					options: yesNoOptions,
					helperText: "Confirm whether vendor audit report is prepared.",
				})}
			</div>
			<div className="vendor-form-textarea">
				{isReadOnly ? (
					<VendorDetailValue
						label="Nature of Service"
						value={values.natureOfService}
						required
					/>
				) : (
					<TextareaInput
						name="natureOfService"
						label="Nature of Service"
						value={values.natureOfService ?? ""}
						required={true}
						error={errors.natureOfService}
						helperText="Additional remarks."
						onChange={(event) => event.target.value}
					/>
				)}
				{isReadOnly ? (
					<VendorDetailValue
						label="Reason for Onboarding of Vendor"
						value={values.reasonForOnboarding}
						required
					/>
				) : (
					<TextareaInput
						name="reasonForOnboarding"
						label="Reason for Onboarding of Vendor"
						value={values.reasonForOnboarding ?? ""}
						required={true}
						error={errors.reasonForOnboarding}
						helperText="Additional remarks."
						onChange={(event) => event.target.value}
					/>
				)}
			</div>

			{/* <FormHeader title="Proposed By" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				{renderInput({
					name: "proposedByName",
					label: "Name",
					helperText: "Proposer name.",
				})}

				{renderInput({
					name: "proposedByDesignation",
					label: "Designation",
					helperText: "Proposer designation.",
				})}

				{renderInput({
					name: "proposedDate",
					label: "Proposed Date",
					helperText: "Date of proposal.",
				})}
			</div>

			<FormHeader title="Approved By" Icon={FileCheck2} />

			<div className="vendor-onboarding-form-grid">
				{renderInput({
					name: "approvedByName",
					label: "Name",
					helperText: "Approver name.",
				})}

				{renderInput({
					name: "approvedByDesignation",
					label: "Designation",
					helperText: "Approver designation.",
				})}

				{renderInput({
					name: "approvalDate",
					label: "Approval Date",
					helperText: "Date of approval.",
				})}
			</div> */}

			{isReadOnly ? null : (
				<div className="vendor-onboarding-form-actions">
					<Button
						type="button"
						text="Back"
						size="sm"
						Icon={ArrowLeft}
						iconPosition="left"
						appearance="ghost"
						variant="secondary"
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

export default VendorCreationFormTwo;
