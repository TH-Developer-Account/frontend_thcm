import { ArrowLeft, ArrowRight } from "lucide-react";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";

import type {
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorFormMode,
} from "../types/vendorOnboarding.types";
import { useOptionalVendorCreationFormContext } from "../hooks/useVendorCreationForm";
import type { Option } from "../../../components/forms/input.types";
import { vendorContent } from "../utils/vendor.content";
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

// All on-screen copy lives in content/vendor.content.en.json
// (formTwo.fields.*, buttons.*, common.*). Nothing below is hardcoded.
const { fields } = vendorContent.formTwo;
const { buttons, common } = vendorContent;

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
	onReset?: () => void;

	errors?: VendorFormErrors<VendorCreationFormTwoValues>;

	loading?: boolean;
	vendorCodeLoading?: boolean;
};

const getSelectedOption = (options: Option[], value?: string): Option | null =>
	options.find((option) => option.value === value) ?? null;

// Stored values stay "Yes" / "No"; only the visible label comes from content.
const yesNoOptions: Option[] = [
	{ label: common.yes, value: "Yes" },
	{ label: common.no, value: "No" },
];

const VendorCreationFormTwo = ({
	mode = "edit",
	canEdit = true,
	canEditVendorCode = false,
	values: valuesProp,
	onChange: onChangeProp,
	onBack: onBackProp,
	onNext: onNextProp,
	// onSaveDraft: onSaveDraftProp,
	// onReset: onResetProp,
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
	// const onSaveDraft = onSaveDraftProp ?? formContext?.handleSaveFormTwoDraft;
	// const onReset = onResetProp ?? formContext?.handleResetFormTwo;
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
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				<div className="vendor-onboarding-form-grid">
					{values.vendorCode ? (
						<FormInput
							mode={vendorCodeMode}
							name="vendorCode"
							label={fields.vendorCode.label}
							value={values.vendorCode ?? ""}
							error={canEditVendorCode ? errors.vendorCode : undefined}
							helperText={
								canEditVendorCode ? fields.vendorCode.helperText : undefined
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
						label={fields.vendorType.label}
						success={
							fieldMode === "edit" &&
							!errors.vendorType &&
							Boolean(values.vendorType)
						}
						placeholder={fields.vendorType.placeholder}
						options={vendorTypeOptions}
						value={getSelectedOption(vendorTypeOptions, values.vendorType)}
						required
						error={errors.vendorType}
						helperText={fields.vendorType.helperText}
						onChange={(option) => onChange?.("vendorType", option?.value ?? "")}
					/>

					<SelectInput
						mode={fieldMode}
						name="companyCode"
						label={fields.companyCode.label}
						placeholder={fields.companyCode.placeholder}
						options={companyCodeOptions}
						value={getSelectedOption(companyCodeOptions, values.companyCode)}
						required
						error={errors.companyCode}
						success={
							fieldMode === "edit" &&
							!errors.companyCode &&
							Boolean(values.companyCode)
						}
						helperText={fields.companyCode.helperText}
						onChange={(option) =>
							onChange?.("companyCode", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="purchaseOrg"
						label={fields.purchaseOrg.label}
						placeholder={fields.purchaseOrg.placeholder}
						options={purchaseOrgOptions}
						value={getSelectedOption(purchaseOrgOptions, values.purchaseOrg)}
						required
						error={errors.purchaseOrg}
						success={
							fieldMode === "edit" &&
							!errors.purchaseOrg &&
							Boolean(values.purchaseOrg)
						}
						helperText={fields.purchaseOrg.helperText}
						onChange={(option) =>
							onChange?.("purchaseOrg", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="paymentTerm"
						label={fields.paymentTerm.label}
						placeholder={fields.paymentTerm.placeholder}
						options={paymentTermOptions}
						value={getSelectedOption(paymentTermOptions, values.paymentTerm)}
						required
						success={
							fieldMode === "edit" &&
							!errors.paymentTerm &&
							Boolean(values.paymentTerm)
						}
						error={errors.paymentTerm}
						helperText={fields.paymentTerm.helperText}
						onChange={(option) =>
							onChange?.("paymentTerm", option?.value ?? "")
						}
					/>
					<SelectInput
						mode={fieldMode}
						name="tds"
						label={fields.tds.label}
						placeholder={fields.tds.placeholder}
						options={tdsOptions}
						value={getSelectedOption(tdsOptions, values.tds)}
						required
						error={errors.tds}
						success={fieldMode === "edit" && !errors.tds && Boolean(values.tds)}
						helperText={fields.tds.helperText}
						onChange={(option) => onChange?.("tds", option?.value ?? "")}
					/>

					<SelectInput
						mode={fieldMode}
						name="vendorCategory"
						label={fields.vendorCategory.label}
						placeholder={fields.vendorCategory.placeholder}
						options={vendorCategoryOptions}
						value={getSelectedOption(
							vendorCategoryOptions,
							values.vendorCategory,
						)}
						required
						success={
							fieldMode === "edit" &&
							!errors.vendorCategory &&
							Boolean(values.vendorCategory)
						}
						error={errors.vendorCategory}
						helperText={fields.vendorCategory.helperText}
						onChange={(option) =>
							onChange?.("vendorCategory", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="materialType"
						label={fields.materialType.label}
						placeholder={fields.materialType.placeholder}
						options={materialTypeOptions}
						value={getSelectedOption(materialTypeOptions, values.materialType)}
						required
						error={errors.materialType}
						success={
							fieldMode === "edit" &&
							!errors.materialType &&
							Boolean(values.materialType)
						}
						helperText={fields.materialType.helperText}
						onChange={(option) =>
							onChange?.("materialType", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="materialSubType"
						label={fields.materialSubType.label}
						placeholder={fields.materialSubType.placeholder}
						options={materialSubTypeOptions}
						value={getSelectedOption(
							materialSubTypeOptions,
							values.materialSubType,
						)}
						required
						success={
							fieldMode === "edit" &&
							!errors.materialSubType &&
							Boolean(values.materialSubType)
						}
						error={errors.materialSubType}
						helperText={fields.materialSubType.helperText}
						onChange={(option) =>
							onChange?.("materialSubType", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="vendorSelfAssessmentObtained"
						label={fields.vendorSelfAssessmentObtained.label}
						placeholder={fields.vendorSelfAssessmentObtained.placeholder}
						options={yesNoOptions}
						value={getSelectedOption(
							yesNoOptions,
							values.vendorSelfAssessmentObtained,
						)}
						required
						success={
							fieldMode === "edit" &&
							!errors.vendorSelfAssessmentObtained &&
							Boolean(values.vendorSelfAssessmentObtained)
						}
						error={errors.vendorSelfAssessmentObtained}
						helperText={fields.vendorSelfAssessmentObtained.helperText}
						onChange={(option) =>
							onChange?.("vendorSelfAssessmentObtained", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="gpaObtained"
						label={fields.gpaObtained.label}
						placeholder={fields.gpaObtained.placeholder}
						options={yesNoOptions}
						value={getSelectedOption(yesNoOptions, values.gpaObtained)}
						required
						error={errors.gpaObtained}
						success={
							fieldMode === "edit" &&
							!errors.gpaObtained &&
							Boolean(values.gpaObtained)
						}
						helperText={fields.gpaObtained.helperText}
						onChange={(option) =>
							onChange?.("gpaObtained", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="relatedPartyToThcm"
						label={fields.relatedPartyToThcm.label}
						placeholder={fields.relatedPartyToThcm.placeholder}
						options={yesNoOptions}
						value={getSelectedOption(yesNoOptions, values.relatedPartyToThcm)}
						required
						error={errors.relatedPartyToThcm}
						success={
							fieldMode === "edit" &&
							!errors.relatedPartyToThcm &&
							Boolean(values.relatedPartyToThcm)
						}
						helperText={fields.relatedPartyToThcm.helperText}
						onChange={(option) =>
							onChange?.("relatedPartyToThcm", option?.value ?? "")
						}
					/>

					<SelectInput
						mode={fieldMode}
						name="vendorAuditReportPrepared"
						label={fields.vendorAuditReportPrepared.label}
						placeholder={fields.vendorAuditReportPrepared.placeholder}
						options={yesNoOptions}
						value={getSelectedOption(
							yesNoOptions,
							values.vendorAuditReportPrepared,
						)}
						required
						success={
							fieldMode === "edit" &&
							!errors.vendorAuditReportPrepared &&
							Boolean(values.vendorAuditReportPrepared)
						}
						error={errors.vendorAuditReportPrepared}
						helperText={fields.vendorAuditReportPrepared.helperText}
						onChange={(option) =>
							onChange?.("vendorAuditReportPrepared", option?.value ?? "")
						}
					/>
				</div>

				<div className="vendor-form-textarea">
					<TextareaInput
						mode={fieldMode}
						name="natureOfService"
						label={fields.natureOfService.label}
						value={values.natureOfService ?? ""}
						required
						error={errors.natureOfService}
						success={
							fieldMode === "edit" &&
							!errors.natureOfService &&
							Boolean(values.natureOfService)
						}
						helperText={fields.natureOfService.helperText}
						onChange={(event) =>
							onChange?.("natureOfService", event.target.value)
						}
					/>

					<TextareaInput
						mode={fieldMode}
						name="reasonForOnboarding"
						label={fields.reasonForOnboarding.label}
						value={values.reasonForOnboarding ?? ""}
						required
						error={errors.reasonForOnboarding}
						success={
							fieldMode === "edit" &&
							!errors.reasonForOnboarding &&
							Boolean(values.reasonForOnboarding)
						}
						helperText={fields.reasonForOnboarding.helperText}
						onChange={(event) =>
							onChange?.("reasonForOnboarding", event.target.value)
						}
					/>
				</div>
				{isReadOnly ? null : (
					<div className="vendor-onboarding-form-actions">
						<Button
							type="button"
							text={buttons.back}
							size="sm"
							Icon={ArrowLeft}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							onClick={onBack}
							disabled={loading}
						/>

						<div className="vendor-onboarding-form-actions-end">
							{/* <Button
								type="button"
								text={buttons.reset}
								Icon={RefreshCcw}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onReset}
								disabled={loading || !onReset}
							/> */}

							{/* <Button
								type="button"
								text={loading ? buttons.saving : buttons.saveAsDraft}
								Icon={Save}
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onSaveDraft}
								disabled={loading || !onSaveDraft}
							/> */}

							<Button
								type="button"
								text={loading ? buttons.saving : buttons.saveAndProceed}
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
