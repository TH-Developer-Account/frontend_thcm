import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	FileCheck2,
	RefreshCcw,
	Save,
	ShieldCheck,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";

import FormHeader from "../../../components/ui/FormHeader";

import type {
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorFormMode,
} from "../types/vendorOnboarding.types";
import { useOptionalVendorCreationFormContext } from "../hooks/useVendorCreationForm";

export type VendorCreationFormTwoProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;
	canEditVendorCode?: boolean;

	values?: VendorCreationFormTwoValues;

	onChange?: <K extends keyof VendorCreationFormTwoValues>(
		key: K,
		value: VendorCreationFormTwoValues[K],
	) => void;

	onBack?: () => void;
	onNext?: () => void;
	onSaveDraft?: () => void;

	errors?: VendorFormErrors<VendorCreationFormTwoValues>;

	loading?: boolean;
	vendorCodeLoading?: boolean;
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

const VendorCreationFormTwo = ({
	mode = "edit",
	canEdit = true,
	canEditVendorCode = false,
	values: valuesProp,
	onChange: onChangeProp,
	onBack: onBackProp,
	onNext: onNextProp,
	onSaveDraft: onSaveDraftProp,
	errors: errorsProp,
	loading: loadingProp = false,
	vendorCodeLoading: vendorCodeLoadingProp = false,
}: VendorCreationFormTwoProps) => {
	const formContext = useOptionalVendorCreationFormContext();
	const values = valuesProp ?? formContext?.formTwoValues ?? {};
	const errors = errorsProp ?? formContext?.formTwoErrors ?? {};
	const onChange = onChangeProp ?? formContext?.handleFormTwoChange;
	const onBack = onBackProp ?? formContext?.handleBack;
	const onNext = onNextProp ?? formContext?.handleSaveFormTwo;
	const onSaveDraft = onSaveDraftProp ?? formContext?.handleSaveFormTwoDraft;
	const loading = loadingProp || formContext?.mutationLoading || false;
	const vendorCodeLoading =
		vendorCodeLoadingProp || formContext?.vendorCodeLoading || false;
	const isReadOnly = mode === "view" || !canEdit;

	const fieldMode: VendorFormMode = isReadOnly ? "view" : "edit";

	const vendorCodeMode: VendorFormMode = canEditVendorCode ? "edit" : "view";

	return (
		<Card
			footer={
				isReadOnly ? null : (
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
								text={loading ? "Saving..." : "Save as Draft"}
								Icon={Save}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onSaveDraft}
								disabled={loading || !onSaveDraft}
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
				)
			}
		>
			<form
				className="vendor-onboarding-form"
				onSubmit={(event) => event.preventDefault()}
			>
				<FormHeader title="THCM Vendor Master Details" Icon={FileCheck2} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						mode={vendorCodeMode}
						name="vendorCode"
						label="Vendor Code"
						value={values.vendorCode ?? ""}
						error={canEditVendorCode ? errors.vendorCode : undefined}
						helperText={
							canEditVendorCode ? "Enter or update the vendor code." : undefined
						}
						disabled={vendorCodeLoading}
						onChange={(event) => {
							if (!canEditVendorCode) {
								return;
							}

							onChange?.("vendorCode", event.target.value);
						}}
					/>

					<SelectInput
						mode={fieldMode}
						name="vendorType"
						label="Vendor Type"
						placeholder="Select vendor type"
						options={vendorTypeOptions}
						value={getSelectedOption(vendorTypeOptions, values.vendorType)}
						required
						error={errors.vendorType}
						helperText="Choose whether the vendor is PO based, non-PO based, or not applicable."
						onChange={(option) => onChange?.("vendorType", option?.value ?? "")}
					/>

					<SelectInput
						mode={fieldMode}
						name="companyCode"
						label="Company Code"
						placeholder="Select company code"
						options={companyCodeOptions}
						value={getSelectedOption(companyCodeOptions, values.companyCode)}
						required
						error={errors.companyCode}
						helperText="Select the applicable THCM company code."
						onChange={(option) =>
							onChange?.("companyCode", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="purchaseOrg"
						label="Purchase Org"
						placeholder="Select purchase organization"
						options={purchaseOrgOptions}
						value={getSelectedOption(purchaseOrgOptions, values.purchaseOrg)}
						required
						error={errors.purchaseOrg}
						helperText="Select the purchase organization applicable to this vendor."
						onChange={(option) =>
							onChange?.("purchaseOrg", option?.value ?? "")
						}
					/>
				</div>

				<FormHeader title="Finance & Tax Classification" Icon={Banknote} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						mode={fieldMode}
						name="paymentTerm"
						label="Payment Term"
						value={values.paymentTerm ?? ""}
						error={errors.paymentTerm}
						helperText="Payment terms applicable to this vendor."
						onChange={(event) => onChange?.("paymentTerm", event.target.value)}
					/>

					<SelectInput
						mode={fieldMode}
						name="tds"
						label="TDS"
						placeholder="Select TDS"
						options={tdsOptions}
						value={getSelectedOption(tdsOptions, values.tds)}
						error={errors.tds}
						helperText="Select the applicable TDS section."
						onChange={(option) => onChange?.("tds", option?.value ?? "")}
					/>

					<SelectInput
						mode={fieldMode}
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
						mode={fieldMode}
						name="materialType"
						label="Material Type"
						placeholder="Select material type"
						options={materialTypeOptions}
						value={getSelectedOption(materialTypeOptions, values.materialType)}
						error={errors.materialType}
						helperText="Select direct, indirect, or not applicable."
						onChange={(option) =>
							onChange?.("materialType", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
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
				</div>

				<FormHeader title="Compliance Declarations" Icon={ShieldCheck} />

				<div className="vendor-onboarding-form-grid">
					<SelectInput
						mode={fieldMode}
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
						mode={fieldMode}
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
						mode={fieldMode}
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
						mode={fieldMode}
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
				</div>

				<div className="vendor-form-textarea">
					<TextareaInput
						mode={fieldMode}
						name="natureOfService"
						label="Nature of Service"
						value={values.natureOfService ?? ""}
						required
						error={errors.natureOfService}
						helperText="Describe the nature of services provided by the vendor."
						onChange={(event) =>
							onChange?.("natureOfService", event.target.value)
						}
					/>

					<TextareaInput
						mode={fieldMode}
						name="reasonForOnboarding"
						label="Reason for Onboarding of Vendor"
						value={values.reasonForOnboarding ?? ""}
						required
						error={errors.reasonForOnboarding}
						helperText="Explain why this vendor is being onboarded."
						onChange={(event) =>
							onChange?.("reasonForOnboarding", event.target.value)
						}
					/>
				</div>
			</form>
		</Card>
	);
};

export default VendorCreationFormTwo;
