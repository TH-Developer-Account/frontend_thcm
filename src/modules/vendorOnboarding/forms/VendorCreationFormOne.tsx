import {
	ArrowLeft,
	CheckCircle2,
	FilePenLine,
	Plus,
	// RefreshCcw,
	Save,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import Button from "../../../components/common/Button";
// import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";
import PhoneInput from "../../../components/forms/PhoneInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { getCitiesByState } from "../helpers/vendorLocation.helpers";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";

import { toYesNo } from "../helpers/vendor.onboarding.helper";
import {
	type VendorCreationFormOneValues,
	type VendorFormErrors,
	type VendorFormMode,
	type VendorOnboardingDocument,
	VENDOR_DOCUMENT_FIELDS,
	type VendorDocumentType,
} from "../types/vendorOnboarding.types";
import {
	NOT_APPLICABLE,
	isNotApplicable,
} from "../helpers/vendor.onboarding.validations";
import {
	useOptionalVendorCreationFormContext,
	useVendorCreationFormOneController,
	type VendorCreationFormOneSubmission,
	type VendorCreationFormOneDraftSubmission,
} from "../hooks/useVendorCreationForm";
import { STATES } from "../utils/vendor.location.constant";

export type {
	VendorCreationFormOneSubmission,
	VendorEnclosureUploadItem,
} from "../hooks/useVendorCreationForm";

const EMPTY_VENDOR_DOCUMENTS: VendorOnboardingDocument[] = [];

type SelectOption = {
	label: string;
	value: string;
};

type VendorCreationFormOneProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;

	values?: VendorCreationFormOneValues;
	errors?: VendorFormErrors<VendorCreationFormOneValues>;

	initialDocuments?: VendorOnboardingDocument[];
	requireDocuments?: boolean;
	requireDpdpConsent?: boolean;

	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;

	onNext?: () => void;
	onBack?: () => void;

	onSubmit?: (
		submission: VendorCreationFormOneSubmission,
	) => void | Promise<void>;
	onSaveDraft?: (
		submission: VendorCreationFormOneDraftSubmission,
	) => void | Promise<void>;

	loading?: boolean;
	submittedMessage?: string;
	actionText?: string;
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

const blockClipboardEvent = (event: ClipboardEvent<HTMLInputElement>) => {
	event.preventDefault();
};

const yesNoOptions = toSelectOptions(["Yes", "No"]);

const applicabilityOptions = toSelectOptions(["Applicable", NOT_APPLICABLE]);
const msmeOptions = toSelectOptions(["Yes", "No", NOT_APPLICABLE]);

// Every row below the address/bank sections uses the same grid class as those
// sections (4 cols desktop / 2 tablet / 1 mobile, same gap and same padding),
// so all inputs line up on identical columns and spacing.
const FORM_ROW_GRID = "vendor-onboarding-form-grid";

// Rendered inline in the tax-details grid, so excluded from the generic
// upload grid below.
const INLINE_DOCUMENT_TYPES: VendorDocumentType[] = [
	"GST_CERTIFICATE",
	"PAN_DOCUMENT",
	"INCORPORATION_CERTIFICATE",
	"CANCELLED_CHEQUE",
];

// toYesNo() maps "N/A" to "", so the MSME select needs its own mapping.
const toMsmeSelectValue = (value?: string): string =>
	isNotApplicable(value) ? NOT_APPLICABLE : toYesNo(value);

// Form One stores only the national number (no country code field in the
// schema/payload), so the prefix is fixed to India. With a single entry,
// PhoneInput renders the attached "+91" segment without a dropdown.
const MOBILE_COUNTRY_CODES = [{ code: "+91", label: "India (+91)" }];

// The prefilled mobile (from the initiation record) can arrive with the
// country code attached, e.g. "919845012345" or "+919845012345". The prefix
// is already shown in the attached segment, so strip it from the input value.
const toNationalMobile = (value?: string | null): string => {
	const raw = (value ?? "").trim();
	const digits = raw.replace(/\D/g, "");

	if (digits.length > 10 && digits.startsWith("91")) {
		return digits.slice(-10);
	}

	return raw;
};

const VendorCreationFormOne = ({
	mode = "edit",
	canEdit = true,
	values: valuesProp,
	onChange,
	onNext,
	onBack,
	onSubmit,
	onSaveDraft,
	errors: errorsProp,
	initialDocuments: initialDocumentsProp,
	requireDocuments = true,
	requireDpdpConsent = false,
	loading: loadingProp = false,
	submittedMessage,
	actionText,
}: VendorCreationFormOneProps) => {
	const formContext = useOptionalVendorCreationFormContext();
	const values = valuesProp ?? formContext?.formOneValues ?? {};
	const errors = errorsProp ?? formContext?.formOneErrors ?? {};
	const initialDocuments =
		initialDocumentsProp ??
		formContext?.formOneDocuments ??
		EMPTY_VENDOR_DOCUMENTS;
	const resolvedOnChange = onChange ?? formContext?.handleFormOneChange;
	const resolvedOnNext = onNext;
	const resolvedOnBack = onBack ?? formContext?.handleBack;
	const resolvedOnSubmit =
		onSubmit ??
		(formContext?.canSubmitVendorForm
			? formContext.handleVendorSubmitForm
			: undefined);

	const resolvedOnSaveDraft =
		onSaveDraft ??
		(formContext?.canSubmitVendorForm
			? formContext.handleVendorDraftSubmitForm
			: formContext?.canSubmit
				? formContext.handleSaveFormOneDraft
				: undefined);
	const loading = loadingProp || formContext?.mutationLoading || false;

	const isReadOnly = mode === "view" || !canEdit;
	const fieldMode: VendorFormMode = isReadOnly ? "view" : "edit";

	const maskAccountNumber = (value?: string): string | undefined => {
		const accountNumber = (value ?? "").trim();
		if (!accountNumber) return undefined;

		const visibleCharacters = accountNumber.slice(-4);
		const maskedCharacters = "*".repeat(
			Math.max(0, accountNumber.length - visibleCharacters.length),
		);

		return `${maskedCharacters}${visibleCharacters}`;
	};

	const sanitizeAccountNumber = (value: string): string =>
		value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
	const {
		enclosureErrors,
		// isDpdpModalOpen,
		hasAcceptedDpdp,
		// hasConfirmedDpdp,
		dpdpError,
		getEnclosureFile,
		visibleDocumentFields,
		canAddMoreDocuments,
		handleAddMoreDocument,
		isEnclosureRequired,
		handleEnclosureChange,
		handleEnclosureTypeChange,
		handleConditionalFieldChange,
		handleApplicabilityChange,
		// openDpdpModal,
		// closeDpdpModal,
		// handleDpdpConsentChange,
		handleDpdpConsentToggle,
		// handleAcceptDpdpTerms,
		// handleReset,
		handleSaveDraft,
		handleFormAction,
		// setHasConfirmedDpdp,
	} = useVendorCreationFormOneController({
		values,
		initialDocuments,
		requireDocuments,
		requireDpdpConsent,
		isReadOnly,
		// Field validation runs before enclosure/file validation inside
		// handleFormAction, so an empty submit surfaces field errors first.
		// The "WithFeedback" variant also toasts the failing field names.
		validateFields: formContext?.validateFormOneWithFeedback,
		onResetFields: formContext?.handleResetFormOne,
		onChange: resolvedOnChange,
		onNext: resolvedOnNext,
		onSubmit: resolvedOnSubmit,
		onSaveDraft: resolvedOnSaveDraft,
	});

	const isGstApplicable = values.gstApplicability === "Applicable";
	const isIncorporationApplicable =
		values.incorporationApplicability === "Applicable";

	const renderUpload = (documentType: VendorDocumentType) => {
		const field = VENDOR_DOCUMENT_FIELDS.find(
			(item) => item.documentType === documentType,
		);
		if (!field) return null;

		return (
			<FileUploadField
				key={field.documentType}
				value={getEnclosureFile(field.documentType)}
				onChange={(nextValue) => handleEnclosureChange(field, nextValue)}
				kind="vendorDocument"
				label={field.label}
				description={field.description}
				required={isEnclosureRequired(field)}
				error={enclosureErrors[field.statusKey]}
				readonly={isReadOnly}
				disabled={loading}
				tooltip={isEnclosureRequired(field) ? "Mandatory" : undefined}
				heightClassName="vendor-enclosure-upload-height"
				className="vendor-enclosure-upload-field"
				inputName={field.documentType}
				showActions
			/>
		);
	};

	return (
		<>
			<form
				className="vendor-onboarding-form"
				// Validation is Zod-only; stop the browser's own "Please fill
				// out this field" bubbles (triggered by Enter in a text input).
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				{submittedMessage ? (
					<div className="vendor-onboarding-form-message">
						<CheckCircle2 aria-hidden="true" size={18} />

						<span>{submittedMessage}</span>
					</div>
				) : null}

				<div className="vendor-onboarding-form-grid-parent">
					<div className="vendor-onboarding-form-grid-child">
						<FormInput
							mode={fieldMode}
							name="vendorName"
							label="Name Of Vendor"
							value={values.vendorName ?? ""}
							error={errors.vendorName}
							success={
								fieldMode === "edit" &&
								!errors.vendorName &&
								Boolean(values.vendorName)
							}
							helperText="Enter vendor name in capital letters."
							onChange={(event) =>
								resolvedOnChange?.("vendorName", event.target.value)
							}
							required
						/>
						<PhoneInput
							mode={fieldMode}
							name="mobile"
							label="Mobile"
							countryCodes={MOBILE_COUNTRY_CODES}
							countryCodeValue="+91"
							autoComplete="tel-national"
							value={toNationalMobile(values.mobile)}
							readOnlyValue={toNationalMobile(values.mobile)}
							success={
								fieldMode === "edit" && !errors.mobile && Boolean(values.mobile)
							}
							required
							error={errors.mobile}
							helperText="Vendor mobile number."
							onChange={(event) =>
								resolvedOnChange?.("mobile", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="email"
							label="E-mail"
							type="email"
							autoComplete="email"
							value={values.email ?? ""}
							success={
								fieldMode === "edit" && !errors.email && Boolean(values.email)
							}
							required
							error={errors.email}
							helperText="Vendor email address."
							onChange={(event) =>
								resolvedOnChange?.("email", event.target.value)
							}
						/>
						<SelectInput
							mode={fieldMode}
							name="state"
							label="State"
							placeholder="Select state"
							options={STATES}
							selectOnAutofill={false}
							value={getSelectedOption(STATES, values.state)}
							required
							error={errors.state}
							success={
								fieldMode === "edit" && !errors.state && Boolean(values.state)
							}
							helperText="Select the applicable vendor state."
							onChange={(option) => {
								const nextState = option?.value ?? "";
								resolvedOnChange?.("state", nextState);
								if (values.city && nextState) {
									const stillValid = getCitiesByState(nextState).some(
										(c) => c.city === values.city,
									);
									if (!stillValid) resolvedOnChange?.("city", "");
								}
							}}
						/>

						<FormInput
							mode={fieldMode}
							name="city"
							label="City/ Town"
							placeholder="Select city"
							value={values.city ?? ""}
							required
							success={
								fieldMode === "edit" && !errors.city && Boolean(values.city)
							}
							error={errors.city}
							helperText="Vendor city."
							onChange={(event) =>
								resolvedOnChange?.("city", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="pinCode"
							label="Pin Code"
							value={values.pinCode ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.pinCode &&
								Boolean(values.pinCode)
							}
							inputMode="numeric"
							error={errors.pinCode}
							helperText="Vendor location pin code."
							onChange={(event) =>
								resolvedOnChange?.("pinCode", event.target.value)
							}
						/>
					</div>

					<div>
						<TextareaInput
							mode={fieldMode}
							name="address"
							label="Complete Address"
							value={values.address ?? ""}
							success={
								fieldMode === "edit" &&
								!errors.address &&
								Boolean(values.address)
							}
							required
							error={errors.address}
							helperText="Registered or communication address."
							onChange={(event) =>
								resolvedOnChange?.("address", event.target.value)
							}
							rows={4}
						/>
					</div>
				</div>

				<div className="vendor-onboarding-form-grid-parent">
					<div className="vendor-onboarding-form-grid-child">
						<FormInput
							mode={fieldMode}
							name="bankName"
							label="Bank"
							value={values.bankName ?? ""}
							success={
								fieldMode === "edit" &&
								!errors.bankName &&
								Boolean(values.bankName)
							}
							required
							error={errors.bankName}
							helperText="Bank name."
							onChange={(event) =>
								resolvedOnChange?.("bankName", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="bankBranch"
							label="Branch"
							value={values.bankBranch ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.bankBranch &&
								Boolean(values.bankBranch)
							}
							error={errors.bankBranch}
							helperText="Bank branch."
							onChange={(event) =>
								resolvedOnChange?.("bankBranch", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="ifscCode"
							label="IFSC Code"
							value={values.ifscCode ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.ifscCode &&
								Boolean(values.ifscCode)
							}
							error={errors.ifscCode}
							helperText="Bank IFSC code."
							onChange={(event) =>
								resolvedOnChange?.("ifscCode", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="accountNumber"
							label="A/C No."
							type="password"
							value={values.accountNumber ?? ""}
							readOnlyValue={maskAccountNumber(values.accountNumber)}
							required
							inputMode="text"
							error={errors.accountNumber}
							success={
								!isReadOnly &&
								!errors.accountNumber &&
								Boolean(values.accountNumber)
							}
							helperText="Vendor bank account number."
							onChange={(event) => {
								const value = sanitizeAccountNumber(event.target.value);
								resolvedOnChange?.("accountNumber", value);
							}}
							onPaste={blockClipboardEvent}
							onCopy={blockClipboardEvent}
							onCut={blockClipboardEvent}
							autoComplete="off"
						/>

						<FormInput
							mode={fieldMode}
							name="confirmAccountNumber"
							label="Confirm Account Number"
							type="password"
							value={values.confirmAccountNumber ?? ""}
							readOnlyValue={maskAccountNumber(values.confirmAccountNumber)}
							required
							inputMode="text"
							error={errors.confirmAccountNumber}
							success={
								!isReadOnly &&
								!errors.confirmAccountNumber &&
								Boolean(values.confirmAccountNumber) &&
								values.confirmAccountNumber === values.accountNumber
							}
							helperText="Re-enter the bank account number."
							onChange={(event) => {
								const value = sanitizeAccountNumber(event.target.value);
								resolvedOnChange?.("confirmAccountNumber", value);
							}}
							onPaste={blockClipboardEvent}
							onCopy={blockClipboardEvent}
							onCut={blockClipboardEvent}
							autoComplete="off"
						/>
					</div>
					<div>
						<TextareaInput
							mode={fieldMode}
							name="bankAddress"
							label="Address"
							value={values.bankAddress ?? ""}
							error={errors.bankAddress}
							success={
								fieldMode === "edit" &&
								!errors.bankAddress &&
								Boolean(values.bankAddress)
							}
							rows={4}
							helperText="Bank branch address."
							onChange={(event) =>
								resolvedOnChange?.("bankAddress", event.target.value)
							}
							required
						/>
					</div>
				</div>
				{/* Row 1 — GST Applicable? | GSTIN | PAN | Entity Reg. No. */}
				<div className={FORM_ROW_GRID}>
					<SelectInput
						mode={fieldMode}
						name="gstApplicability"
						label="GST Applicable?"
						placeholder="Select option"
						options={applicabilityOptions}
						value={getSelectedOption(
							applicabilityOptions,
							values.gstApplicability,
						)}
						required
						error={errors.gstApplicability}
						helperText="Select whether GST applies to this vendor."
						onChange={(option) =>
							handleApplicabilityChange("gstApplicability", option?.value ?? "")
						}
					/>

					{/* GSTIN only when GST is Applicable; otherwise the row closes up */}
					{isGstApplicable ? (
						<FormInput
							mode={fieldMode}
							name="gstin"
							label="GSTIN"
							value={values.gstin ?? ""}
							success={
								fieldMode === "edit" && !errors.gstin && Boolean(values.gstin)
							}
							required
							maxLength={15}
							error={errors.gstin}
							helperText="GST identification number."
							onChange={(event) =>
								resolvedOnChange?.("gstin", event.target.value.toUpperCase())
							}
						/>
					) : null}

					<FormInput
						mode={fieldMode}
						name="pan"
						label="PAN"
						value={values.pan ?? ""}
						success={fieldMode === "edit" && !errors.pan && Boolean(values.pan)}
						required
						maxLength={10}
						onChange={(event) =>
							resolvedOnChange?.("pan", event.target.value.toUpperCase())
						}
						error={errors.pan}
						helperText="Permanent account number."
					/>

					<FormInput
						mode={fieldMode}
						name="entityRegNo"
						label="Entity Reg. No."
						required
						value={values.entityRegNo ?? ""}
						success={
							fieldMode === "edit" &&
							!errors.entityRegNo &&
							Boolean(values.entityRegNo)
						}
						error={errors.entityRegNo}
						helperText="Entity registration number."
						onChange={(event) =>
							resolvedOnChange?.("entityRegNo", event.target.value)
						}
					/>
				</div>

				{/* Documents, same 4-column grid:
				    GST certificate | PAN document | Incorporation Applicable? | Incorporation certificate
				    Cancelled cheque | Other attachments … */}
				<div className={FORM_ROW_GRID}>
					{isGstApplicable ? renderUpload("GST_CERTIFICATE") : null}

					{renderUpload("PAN_DOCUMENT")}

					<SelectInput
						mode={fieldMode}
						name="incorporationApplicability"
						label="Incorporation Applicable?"
						placeholder="Select option"
						options={applicabilityOptions}
						value={getSelectedOption(
							applicabilityOptions,
							values.incorporationApplicability,
						)}
						required
						error={errors.incorporationApplicability}
						helperText="Select whether incorporation applies to this vendor."
						onChange={(option) =>
							handleApplicabilityChange(
								"incorporationApplicability",
								option?.value ?? "",
							)
						}
					/>

					{isIncorporationApplicable
						? renderUpload("INCORPORATION_CERTIFICATE")
						: null}

					{renderUpload("CANCELLED_CHEQUE")}

					{/* Other attachments flow right after the cheque in the same grid */}
					{visibleDocumentFields
						.filter(
							(field) => !INLINE_DOCUMENT_TYPES.includes(field.documentType),
						)
						.map((field) => renderUpload(field.documentType))}
				</div>
				{canAddMoreDocuments ? (
					<div className="flex justify-end px-4 max-lg:px-3">
						<Button
							type="button"
							text="Add More"
							Icon={Plus}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={loading}
							onClick={handleAddMoreDocument}
						/>
					</div>
				) : null}
				{/* MSME / NDA: same 4-column grid.
				    MSME select | MSME certificate (if Yes) | NDA select | NDA certificate (if Yes) */}
				<div className={FORM_ROW_GRID}>
					<SelectInput
						mode={fieldMode}
						name="msmeVendor"
						label="MSME Vendor"
						placeholder="Select option"
						options={msmeOptions}
						value={getSelectedOption(
							msmeOptions,
							toMsmeSelectValue(values.msmeVendor),
						)}
						required
						error={errors.msmeVendor}
						helperText="Select whether this vendor is registered under MSME."
						onChange={(option) =>
							handleConditionalFieldChange("msmeVendor", option?.value ?? "")
						}
					/>

					{values.msmeVendor === "Yes" ? (
						<FileUploadField
							value={getEnclosureFile("MSME_CERTIFICATE")}
							onChange={(nextValue) =>
								handleEnclosureTypeChange("MSME_CERTIFICATE", nextValue)
							}
							kind="vendorDocument"
							label="MSME Certificate"
							description="Upload the MSME registration certificate."
							required
							error={enclosureErrors.msmeCertificate}
							readonly={isReadOnly}
							disabled={loading}
							heightClassName="vendor-enclosure-upload-height"
							className="vendor-enclosure-upload-field"
							inputName="MSME_CERTIFICATE"
							showActions
							tooltip="Mandatory"
						/>
					) : null}

					<SelectInput
						mode={fieldMode}
						name="ndaObtained"
						label="Non-Disclosure Undertaking Obtained?"
						placeholder="Select option"
						required
						options={yesNoOptions}
						value={getSelectedOption(yesNoOptions, toYesNo(values.ndaObtained))}
						error={errors.ndaObtained}
						helperText="Confirm whether NDA is obtained."
						onChange={(option) =>
							handleConditionalFieldChange("ndaObtained", option?.value ?? "")
						}
					/>

					{values.ndaObtained === "Yes" ? (
						<FileUploadField
							value={getEnclosureFile("NDA_CERTIFICATE")}
							onChange={(nextValue) =>
								handleEnclosureTypeChange("NDA_CERTIFICATE", nextValue)
							}
							kind="vendorDocument"
							label="NDA Certificate"
							description="Upload the signed NDA certificate."
							required
							error={enclosureErrors.ndaCertificate}
							readonly={isReadOnly}
							disabled={loading}
							heightClassName="vendor-enclosure-upload-height"
							className="vendor-enclosure-upload-field"
							inputName="NDA_CERTIFICATE"
							showActions
							tooltip="Mandatory"
						/>
					) : null}
				</div>
				{/* <Modal
					open={isDpdpModalOpen}
					title="Data Privacy Notice"
					size="lg"
					onClose={closeDpdpModal}
					footer_actions={
						<>
							<Button
								type="button"
								text="Cancel"
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={closeDpdpModal}
							/>

							<Button
								type="button"
								text="Accept and Continue"
								Icon={CheckCircle2}
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={!hasConfirmedDpdp}
								onClick={handleAcceptDpdpTerms}
							/>
						</>
					}
				>
					<div className="vendor-dpdp-modal-content">
						<p className="vendor-dpdp-modal-intro">
							Please review how the information provided in this vendor
							onboarding form will be collected, used, stored and shared.
						</p>

						<div className="vendor-dpdp-terms">
							<section className="vendor-dpdp-section">
								<h3>1. Information collected</h3>

								<p>
									We collect the vendor and authorised representative
									information entered in this form, including business contact
									details, address, bank information, tax information,
									registration information and supporting documents.
								</p>
							</section>

							<section className="vendor-dpdp-section">
								<h3>2. Purpose of processing</h3>

								<p>
									The information will be used for vendor onboarding, identity
									and document verification, due diligence, payment processing,
									tax and regulatory compliance, procurement operations,
									communication, audit and record management.
								</p>
							</section>

							<section className="vendor-dpdp-section">
								<h3>3. Information sharing</h3>

								<p>
									The information may be accessed by authorised Tata Hitachi
									personnel and approved service providers where required for
									vendor onboarding, verification, finance, audit, compliance,
									legal obligations and technology support.
								</p>
							</section>

							<section className="vendor-dpdp-section">
								<h3>4. Storage and retention</h3>

								<p>
									The information will be protected using appropriate
									organisational and technical safeguards and retained only for
									the period required for the stated purposes, contractual
									requirements and applicable legal or regulatory obligations.
								</p>
							</section>

							<section className="vendor-dpdp-section">
								<h3>5. Your responsibilities</h3>

								<p>
									You confirm that the information provided is accurate and that
									you are authorised to provide personal data and documents
									relating to the vendor and its representatives.
								</p>
							</section>

							<section className="vendor-dpdp-section">
								<h3>6. Withdrawal and privacy requests</h3>

								<p>
									You may raise a privacy query, correction request, grievance
									or consent-withdrawal request through the privacy or grievance
									contact published by Tata Hitachi.
								</p>
							</section>
						</div>

						<label className="vendor-dpdp-modal-confirmation">
							<input
								type="checkbox"
								checked={hasConfirmedDpdp}
								onChange={(event) => setHasConfirmedDpdp(event.target.checked)}
							/>

							<span>
								I confirm that I have read and understood this Data Privacy
								Notice and consent to the processing of the provided information
								for the purposes stated above.
							</span>
						</label>
					</div>
				</Modal> */}

				{isReadOnly ? (
					resolvedOnNext ? (
						<div className="vendor-onboarding-form-actions">
							<Button
								type="button"
								text={actionText || "Next"}
								size="sm"
								appearance="standard"
								variant="brand"
								onClick={resolvedOnNext}
								disabled={loading}
							/>
						</div>
					) : null
				) : (
					<div className="w-full">
						{requireDpdpConsent ? (
							<div className="vendor-dpdp-consent">
								<label className="vendor-dpdp-consent-control">
									<input
										type="checkbox"
										name="dpdpConsent"
										checked={hasAcceptedDpdp}
										disabled={loading}
										onChange={(event) =>
											handleDpdpConsentToggle(event.target.checked)
										}
									/>

									<span>
										I hereby declare that the information provided in this form
										is true and accurate to the best of my knowledge, and I
										consent to its processing for onboarding and verification
										purposes.
									</span>
								</label>

								{dpdpError ? (
									<p className="vendor-dpdp-consent-error" role="alert">
										{dpdpError}
									</p>
								) : null}
							</div>
						) : null}

						<div className="bottom-buttons-bar-between px-4 max-lg:px-3">
							<Button
								type="button"
								text="Back"
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={resolvedOnBack}
								disabled={loading}
								Icon={ArrowLeft}
							/>

							<div className="bottom-buttons-bar-end">
								{/* <Button
									type="button"
									text="Reset"
									Icon={RefreshCcw}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={loading}
									onClick={handleReset}
								/> */}
								{resolvedOnSaveDraft ? (
									<Button
										type="button"
										text="Save as Draft"
										Icon={FilePenLine}
										size="sm"
										appearance="standard"
										variant="outline"
										disabled={loading}
										onClick={handleSaveDraft}
									/>
								) : null}
								<Button
									type="button"
									text={
										loading
											? resolvedOnSubmit
												? "Submitting..."
												: "Saving..."
											: actionText ||
												(resolvedOnSubmit ? "Submit Form" : "Save & Proceed")
									}
									size="sm"
									appearance="standard"
									variant="brand"
									Icon={Save}
									isTooltip={
										requireDpdpConsent
											? "Please accept the consent form to submit."
											: undefined
									}
									onClick={handleFormAction}
									disabled={loading || (requireDpdpConsent && !hasAcceptedDpdp)}
								/>
							</div>
						</div>
					</div>
				)}
			</form>
		</>
	);
};

export default VendorCreationFormOne;
