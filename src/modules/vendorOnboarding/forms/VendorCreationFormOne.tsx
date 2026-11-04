import {
	ArrowLeft,
	CheckCircle2,
	FilePenLine,
	Plus,
	// RefreshCcw,
	Save,
} from "lucide-react";
import { type ClipboardEvent } from "react";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import PhoneInput from "../../../components/forms/PhoneInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { getCitiesByState } from "../helpers/vendorLocation.helpers";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { vendorContent } from "../utils/vendor.content";

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

// All on-screen copy for this form lives in content/vendor.content.en.json
// (formOne.*, documents.*, buttons.*, common.*). Nothing below is hardcoded.
const content = vendorContent.formOne;
const fields = content.fields;
const { documents, buttons, common } = vendorContent;

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

const getSelectedOption = (
	options: SelectOption[],
	value?: string,
): SelectOption | null =>
	options.find((option) => option.value === value) ?? null;

const blockClipboardEvent = (event: ClipboardEvent<HTMLInputElement>) => {
	event.preventDefault();
};

// Stored values stay "Yes" / "No" (validation, payloads and existing records
// depend on them); only the visible label comes from the content file.
const yesNoOptions: SelectOption[] = [
	{ label: common.yes, value: "Yes" },
	{ label: common.no, value: "No" },
];

// Shown as Yes / N/A. The stored value stays "Applicable", so validation,
// payloads and existing records are unchanged.
const applicabilityOptions: SelectOption[] = [
	{ label: common.yes, value: "Applicable" },
	{ label: common.notApplicable, value: NOT_APPLICABLE },
];
const msmeOptions = yesNoOptions;

// Every row below the address/bank sections uses the same grid class as those
// sections (4 cols desktop / 2 tablet / 1 mobile, same gap and same padding),
// so all inputs line up on identical columns and spacing.
const FORM_ROW_GRID = "vendor-onboarding-form-grid";

// Rendered explicitly (certificates under their selects, PAN document and
// cancelled cheque in the documents row), so excluded from the generic
// "other attachments" list below.
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
const MOBILE_COUNTRY_CODES = [
	{ code: "+91", label: content.mobileCountryLabel },
];

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

	// Typed text is shown masked (only the last 4 characters visible), so the
	// real value is rebuilt from each edit. Supports typing at the end,
	// backspacing from the end and select-all + retype. Edits in the middle of
	// the masked text are ignored (paste/copy/cut are already blocked).
	const applyMaskedEdit = (
		previousValue: string,
		nextDisplay: string,
	): string => {
		const previousDisplay = maskAccountNumber(previousValue) ?? "";

		if (nextDisplay.startsWith(previousDisplay)) {
			return (
				previousValue +
				sanitizeAccountNumber(nextDisplay.slice(previousDisplay.length))
			);
		}

		if (previousDisplay.startsWith(nextDisplay)) {
			return previousValue.slice(0, nextDisplay.length);
		}

		if (!nextDisplay.includes("*")) {
			return sanitizeAccountNumber(nextDisplay);
		}

		return previousValue;
	};
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
				tooltip={
					isEnclosureRequired(field) ? documents.tooltipMandatory : undefined
				}
				heightClassName="vendor-enclosure-upload-height"
				className="vendor-enclosure-upload-field"
				inputName={field.documentType}
				showActions
				previewVariant="line"
			/>
		);
	};

	// MSME / NDA certificates: shown under their select while editing, and in
	// the single Documents section at the bottom in view mode.
	const renderMsmeUpload = () => (
		<FileUploadField
			value={getEnclosureFile("MSME_CERTIFICATE")}
			onChange={(nextValue) =>
				handleEnclosureTypeChange("MSME_CERTIFICATE", nextValue)
			}
			kind="vendorDocument"
			label={documents.MSME_CERTIFICATE.label}
			description={documents.MSME_CERTIFICATE.uploadDescription}
			required
			error={enclosureErrors.msmeCertificate}
			readonly={isReadOnly}
			disabled={loading}
			heightClassName="vendor-enclosure-upload-height"
			className="vendor-enclosure-upload-field"
			inputName="MSME_CERTIFICATE"
			showActions
			tooltip={documents.tooltipMandatory}
			previewVariant="line"
		/>
	);

	const renderNdaUpload = () => (
		<FileUploadField
			value={getEnclosureFile("NDA_CERTIFICATE")}
			onChange={(nextValue) =>
				handleEnclosureTypeChange("NDA_CERTIFICATE", nextValue)
			}
			kind="vendorDocument"
			label={documents.NDA_CERTIFICATE.label}
			description={documents.NDA_CERTIFICATE.uploadDescription}
			required
			error={enclosureErrors.ndaCertificate}
			readonly={isReadOnly}
			disabled={loading}
			heightClassName="vendor-enclosure-upload-height"
			className="vendor-enclosure-upload-field"
			inputName="NDA_CERTIFICATE"
			showActions
			tooltip={documents.tooltipMandatory}
			previewVariant="line"
		/>
	);

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
							label={fields.vendorName.label}
							value={values.vendorName ?? ""}
							error={errors.vendorName}
							success={
								fieldMode === "edit" &&
								!errors.vendorName &&
								Boolean(values.vendorName)
							}
							helperText={fields.vendorName.helperText}
							onChange={(event) =>
								resolvedOnChange?.("vendorName", event.target.value)
							}
							required
						/>
						<PhoneInput
							mode={fieldMode}
							name="mobile"
							label={fields.mobile.label}
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
							helperText={fields.mobile.helperText}
							onChange={(event) =>
								resolvedOnChange?.("mobile", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="email"
							label={fields.email.label}
							type="email"
							autoComplete="email"
							value={values.email ?? ""}
							success={
								fieldMode === "edit" && !errors.email && Boolean(values.email)
							}
							required
							error={errors.email}
							helperText={fields.email.helperText}
							onChange={(event) =>
								resolvedOnChange?.("email", event.target.value)
							}
						/>
						<SelectInput
							mode={fieldMode}
							name="state"
							label={fields.state.label}
							placeholder={fields.state.placeholder}
							options={STATES}
							selectOnAutofill={false}
							value={getSelectedOption(STATES, values.state)}
							required
							error={errors.state}
							success={
								fieldMode === "edit" && !errors.state && Boolean(values.state)
							}
							helperText={fields.state.helperText}
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
							label={fields.city.label}
							placeholder={fields.city.placeholder}
							value={values.city ?? ""}
							required
							success={
								fieldMode === "edit" && !errors.city && Boolean(values.city)
							}
							error={errors.city}
							helperText={fields.city.helperText}
							onChange={(event) =>
								resolvedOnChange?.("city", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="pinCode"
							label={fields.pinCode.label}
							value={values.pinCode ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.pinCode &&
								Boolean(values.pinCode)
							}
							inputMode="numeric"
							error={errors.pinCode}
							helperText={fields.pinCode.helperText}
							onChange={(event) =>
								resolvedOnChange?.("pinCode", event.target.value)
							}
						/>
					</div>

					<div>
						<TextareaInput
							mode={fieldMode}
							name="address"
							label={fields.address.label}
							value={values.address ?? ""}
							success={
								fieldMode === "edit" &&
								!errors.address &&
								Boolean(values.address)
							}
							required
							error={errors.address}
							helperText={fields.address.helperText}
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
							label={fields.bankName.label}
							value={values.bankName ?? ""}
							success={
								fieldMode === "edit" &&
								!errors.bankName &&
								Boolean(values.bankName)
							}
							required
							error={errors.bankName}
							helperText={fields.bankName.helperText}
							onChange={(event) =>
								resolvedOnChange?.("bankName", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="bankBranch"
							label={fields.bankBranch.label}
							value={values.bankBranch ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.bankBranch &&
								Boolean(values.bankBranch)
							}
							error={errors.bankBranch}
							helperText={fields.bankBranch.helperText}
							onChange={(event) =>
								resolvedOnChange?.("bankBranch", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							name="ifscCode"
							label={fields.ifscCode.label}
							value={values.ifscCode ?? ""}
							required
							success={
								fieldMode === "edit" &&
								!errors.ifscCode &&
								Boolean(values.ifscCode)
							}
							error={errors.ifscCode}
							helperText={fields.ifscCode.helperText}
							onChange={(event) =>
								resolvedOnChange?.("ifscCode", event.target.value)
							}
							autoComplete="off"
							data-lpignore="true"
							data-1p-ignore="true"
							data-bwignore="true"
							data-form-type="other"
						/>

						<FormInput
							mode={fieldMode}
							name="accountNumber"
							label={fields.accountNumber.label}
							type="text"
							value={maskAccountNumber(values.accountNumber) ?? ""}
							readOnlyValue={maskAccountNumber(values.accountNumber)}
							required
							inputMode="text"
							error={errors.accountNumber}
							success={
								!isReadOnly &&
								!errors.accountNumber &&
								Boolean(values.accountNumber)
							}
							helperText={fields.accountNumber.helperText}
							onChange={(event) =>
								resolvedOnChange?.(
									"accountNumber",
									applyMaskedEdit(
										values.accountNumber ?? "",
										event.target.value,
									),
								)
							}
							onPaste={blockClipboardEvent}
							onCopy={blockClipboardEvent}
							onCut={blockClipboardEvent}
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck={false}
							data-lpignore="true"
							data-1p-ignore="true"
							data-bwignore="true"
							data-form-type="other"
						/>

						<FormInput
							mode={fieldMode}
							name="confirmAccountNumber"
							label={fields.confirmAccountNumber.label}
							type="text"
							value={maskAccountNumber(values.confirmAccountNumber) ?? ""}
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
							helperText={fields.confirmAccountNumber.helperText}
							onChange={(event) =>
								resolvedOnChange?.(
									"confirmAccountNumber",
									applyMaskedEdit(
										values.confirmAccountNumber ?? "",
										event.target.value,
									),
								)
							}
							onPaste={blockClipboardEvent}
							onCopy={blockClipboardEvent}
							onCut={blockClipboardEvent}
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck={false}
							data-lpignore="true"
							data-1p-ignore="true"
							data-bwignore="true"
							data-form-type="other"
						/>
					</div>
					<div>
						<TextareaInput
							mode={fieldMode}
							name="bankAddress"
							label={fields.bankAddress.label}
							value={values.bankAddress ?? ""}
							error={errors.bankAddress}
							success={
								fieldMode === "edit" &&
								!errors.bankAddress &&
								Boolean(values.bankAddress)
							}
							rows={4}
							helperText={fields.bankAddress.helperText}
							onChange={(event) =>
								resolvedOnChange?.("bankAddress", event.target.value)
							}
							required
						/>
					</div>
				</div>

				{/* Row 1 — each applicability select with its certificate directly
				    underneath (shown only when the answer needs one), one column each */}
				<div className={FORM_ROW_GRID}>
					<div className="vendor-field-stack">
						<SelectInput
							mode={fieldMode}
							name="gstApplicability"
							label={fields.gstApplicability.label}
							placeholder={fields.gstApplicability.placeholder}
							options={applicabilityOptions}
							value={getSelectedOption(
								applicabilityOptions,
								values.gstApplicability,
							)}
							required
							error={errors.gstApplicability}
							helperText={fields.gstApplicability.helperText}
							onChange={(option) =>
								handleApplicabilityChange(
									"gstApplicability",
									option?.value ?? "",
								)
							}
							success={
								fieldMode === "edit" &&
								!errors.gstApplicability &&
								Boolean(values.gstApplicability)
							}
						/>

						{!isReadOnly && isGstApplicable
							? renderUpload("GST_CERTIFICATE")
							: null}
					</div>

					<div className="vendor-field-stack">
						<SelectInput
							mode={fieldMode}
							name="incorporationApplicability"
							label={fields.incorporationApplicability.label}
							placeholder={fields.incorporationApplicability.placeholder}
							options={applicabilityOptions}
							value={getSelectedOption(
								applicabilityOptions,
								values.incorporationApplicability,
							)}
							required
							error={errors.incorporationApplicability}
							helperText={fields.incorporationApplicability.helperText}
							onChange={(option) =>
								handleApplicabilityChange(
									"incorporationApplicability",
									option?.value ?? "",
								)
							}
							success={
								fieldMode === "edit" &&
								!errors.incorporationApplicability &&
								Boolean(values.incorporationApplicability)
							}
						/>

						{!isReadOnly && isIncorporationApplicable
							? renderUpload("INCORPORATION_CERTIFICATE")
							: null}
					</div>

					<div className="vendor-field-stack">
						<SelectInput
							mode={fieldMode}
							name="msmeVendor"
							label={fields.msmeVendor.label}
							placeholder={fields.msmeVendor.placeholder}
							options={msmeOptions}
							value={getSelectedOption(
								msmeOptions,
								toMsmeSelectValue(values.msmeVendor),
							)}
							required
							error={errors.msmeVendor}
							helperText={fields.msmeVendor.helperText}
							onChange={(option) =>
								handleConditionalFieldChange("msmeVendor", option?.value ?? "")
							}
							success={
								fieldMode === "edit" &&
								!errors.msmeVendor &&
								Boolean(values.msmeVendor)
							}
						/>

						{!isReadOnly && values.msmeVendor === "Yes"
							? renderMsmeUpload()
							: null}
					</div>

					<div className="vendor-field-stack">
						<SelectInput
							mode={fieldMode}
							name="ndaObtained"
							label={fields.ndaObtained.label}
							placeholder={fields.ndaObtained.placeholder}
							required
							options={yesNoOptions}
							value={getSelectedOption(
								yesNoOptions,
								toYesNo(values.ndaObtained),
							)}
							error={errors.ndaObtained}
							helperText={fields.ndaObtained.helperText}
							onChange={(option) =>
								handleConditionalFieldChange("ndaObtained", option?.value ?? "")
							}
							success={
								fieldMode === "edit" &&
								!errors.ndaObtained &&
								Boolean(values.ndaObtained)
							}
						/>

						{!isReadOnly && values.ndaObtained === "Yes"
							? renderNdaUpload()
							: null}
					</div>
				</div>

				{/* Row 2 — GSTIN (only if GST applicable) | PAN | Entity Reg. No. */}
				<div className={FORM_ROW_GRID}>
					{isGstApplicable ? (
						<FormInput
							mode={fieldMode}
							name="gstin"
							label={fields.gstin.label}
							value={values.gstin ?? ""}
							success={
								fieldMode === "edit" && !errors.gstin && Boolean(values.gstin)
							}
							required
							maxLength={15}
							error={errors.gstin}
							helperText={fields.gstin.helperText}
							onChange={(event) =>
								resolvedOnChange?.("gstin", event.target.value.toUpperCase())
							}
						/>
					) : null}

					<FormInput
						mode={fieldMode}
						name="pan"
						label={fields.pan.label}
						value={values.pan ?? ""}
						success={fieldMode === "edit" && !errors.pan && Boolean(values.pan)}
						required
						maxLength={10}
						onChange={(event) =>
							resolvedOnChange?.("pan", event.target.value.toUpperCase())
						}
						error={errors.pan}
						helperText={fields.pan.helperText}
					/>

					<FormInput
						mode={fieldMode}
						name="entityRegNo"
						label={fields.entityRegNo.label}
						required
						value={values.entityRegNo ?? ""}
						success={
							fieldMode === "edit" &&
							!errors.entityRegNo &&
							Boolean(values.entityRegNo)
						}
						error={errors.entityRegNo}
						helperText={fields.entityRegNo.helperText}
						onChange={(event) =>
							resolvedOnChange?.("entityRegNo", event.target.value)
						}
					/>
				</div>

				{/* Row 3 — documents. Edit mode: PAN, cancelled cheque, others (the
				    certificates sit under their selects). View mode: ONE Documents
				    section holding every certificate, below all the form fields. */}
				<section aria-labelledby="vendor-documents-heading">
					<div className={FORM_ROW_GRID}>
						{isReadOnly && isGstApplicable
							? renderUpload("GST_CERTIFICATE")
							: null}
						{isReadOnly && isIncorporationApplicable
							? renderUpload("INCORPORATION_CERTIFICATE")
							: null}
						{isReadOnly && values.msmeVendor === "Yes"
							? renderMsmeUpload()
							: null}
						{isReadOnly && values.ndaObtained === "Yes"
							? renderNdaUpload()
							: null}

						{renderUpload("PAN_DOCUMENT")}

						{renderUpload("CANCELLED_CHEQUE")}

						{visibleDocumentFields
							.filter(
								(field) => !INLINE_DOCUMENT_TYPES.includes(field.documentType),
							)
							.map((field) => renderUpload(field.documentType))}

						{/* Sits in the next free cell after the last attachment and moves
						    along as the user adds more; bottom-aligned with the upload boxes */}
						{canAddMoreDocuments ? (
							<div className="flex min-w-0 self-end">
								<Button
									type="button"
									Icon={Plus}
									size="sm"
									text={documents.addMore}
									appearance="standard"
									variant="outline"
									disabled={loading}
									onClick={handleAddMoreDocument}
									className="mb-1"
								/>
							</div>
						) : null}
					</div>
				</section>

				{/* The Data Privacy Notice modal is disabled until legal approves the
				    full notice. Its copy is kept in content.formOne.dpdp (title, intro,
				    six sections, confirmationLabel, acceptAndContinue), so re-enabling
				    it only needs the <Modal> markup plus the commented controller
				    handlers above. */}

				{isReadOnly ? (
					resolvedOnNext ? (
						<div className="vendor-onboarding-form-actions">
							<Button
								type="button"
								text={actionText || buttons.next}
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

									<span>{content.consent.declaration}</span>
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
								text={buttons.back}
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
									text={buttons.reset}
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
										text={buttons.saveAsDraft}
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
												? buttons.submitting
												: buttons.saving
											: actionText ||
												(resolvedOnSubmit
													? buttons.submitForm
													: buttons.saveAndProceed)
									}
									size="sm"
									appearance="standard"
									variant="brand"
									Icon={Save}
									isTooltip={
										requireDpdpConsent ? content.dpdp.submitTooltip : undefined
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
