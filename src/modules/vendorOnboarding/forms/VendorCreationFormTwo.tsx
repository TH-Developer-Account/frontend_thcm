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
import type { Option } from "../../../components/forms/input.types";
import {
	companyCodeOptions,
	materialSubTypeOptions,
	materialTypeOptions,
	paymentTermOptions,
	purchaseOrgOptions,
	tdsOptions,
	vendorCategoryOptions,
	vendorTypeOptions,
} from "../utils/vendor.constant";

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

const toSelectOptions = (values: string[]): Option[] =>
	values.map((value) => ({
		label: value,
		value,
	}));

const getSelectedOption = (options: Option[], value?: string): Option | null =>
	options.find((option) => option.value === value) ?? null;

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
		<>
			<form
				className="vendor-onboarding-form"
				onSubmit={(event) => event.preventDefault()}
			>
				<FormHeader title="THCM Vendor Master Details" Icon={FileCheck2} />

				<div className="vendor-onboarding-form-grid">
					{values.vendorCode ? (
						<FormInput
							mode={vendorCodeMode}
							name="vendorCode"
							label="Vendor Code"
							value={values.vendorCode ?? ""}
							error={canEditVendorCode ? errors.vendorCode : undefined}
							helperText={
								canEditVendorCode
									? "Enter or update the vendor code."
									: undefined
							}
							disabled={vendorCodeLoading}
							onChange={(event) => {
								if (!canEditVendorCode) {
									return;
								}

								onChange?.("vendorCode", event.target.value);
							}}
						/>
					) : null}
					<SelectInput
						mode={fieldMode}
						name="vendorType"
						label="Vendor Type"
						success={
							fieldMode === "edit" &&
							!errors.vendorType &&
							Boolean(values.vendorType)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.companyCode &&
							Boolean(values.companyCode)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.purchaseOrg &&
							Boolean(values.purchaseOrg)
						}
						helperText="Select the purchase organization applicable to this vendor."
						onChange={(option) =>
							onChange?.("purchaseOrg", option?.value ?? "")
						}
					/>
				</div>

				<FormHeader title="Finance & Tax Classification" Icon={Banknote} />

				<div className="vendor-onboarding-form-grid">
					<SelectInput
						mode={fieldMode}
						name="paymentTerm"
						label="Payment Term"
						placeholder="Select Payment Term"
						options={paymentTermOptions}
						value={getSelectedOption(paymentTermOptions, values.paymentTerm)}
						success={
							fieldMode === "edit" &&
							!errors.paymentTerm &&
							Boolean(values.paymentTerm)
						}
						error={errors.paymentTerm}
						helperText="Select proprietary, non-proprietary, or not applicable."
						onChange={(option) =>
							onChange?.("paymentTerm", option?.value ?? "")
						}
					/>
					<SelectInput
						mode={fieldMode}
						name="tds"
						label="TDS"
						placeholder="Select TDS"
						options={tdsOptions}
						value={getSelectedOption(tdsOptions, values.tds)}
						error={errors.tds}
						success={fieldMode === "edit" && !errors.tds && Boolean(values.tds)}
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
						success={
							fieldMode === "edit" &&
							!errors.vendorCategory &&
							Boolean(values.vendorCategory)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.materialType &&
							Boolean(values.materialType)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.materialSubType &&
							Boolean(values.materialSubType)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.vendorSelfAssessmentObtained &&
							Boolean(values.vendorSelfAssessmentObtained)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.gpaObtained &&
							Boolean(values.gpaObtained)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.relatedPartyToThcm &&
							Boolean(values.relatedPartyToThcm)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.vendorAuditReportPrepared &&
							Boolean(values.vendorAuditReportPrepared)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.natureOfService &&
							Boolean(values.natureOfService)
						}
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
						success={
							fieldMode === "edit" &&
							!errors.reasonForOnboarding &&
							Boolean(values.reasonForOnboarding)
						}
						helperText="Explain why this vendor is being onboarded."
						onChange={(event) =>
							onChange?.("reasonForOnboarding", event.target.value)
						}
					/>
				</div>
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
				)}
			</form>
		</>
	);
};

export default VendorCreationFormTwo;
