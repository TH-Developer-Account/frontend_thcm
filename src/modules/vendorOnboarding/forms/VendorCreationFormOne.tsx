import {
	ArrowLeft,
	Banknote,
	CheckCircle2,
	FileCheck2,
	FilePenLine,
	Landmark,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	ShieldCheck,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { getCitiesByState } from "../helpers/vendorLocation.helpers";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";

import FormHeader from "../../../components/ui/FormHeader";
import {
	getAccountNumberConfirmState,
	validateConfirmAccountNumber,
	toYesNo,
} from "../helpers/vendor.onboarding.helper";
import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorFormErrors,
	type VendorFormMode,
	type VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";
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
		// NEW
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

	/*
	 * The backend does not return confirmAccountNumber.
	 *
	 * View/read-only mode:
	 *   Show the account number as the confirmation value.
	 *
	 * Edit mode without account-number changes:
	 *   Show the account number as the confirmation value.
	 *
	 * Edit mode after account-number change:
	 *   Let the user enter confirmAccountNumber.
	 */
	const accountConfirmationState = getAccountNumberConfirmState(
		values,
		formContext?.originalAccountNumber ?? "",
	);

	const { accountNumber, confirmAccountNumber } = accountConfirmationState;

	// Confirmation is validated only when the form is editable.
	const confirmRequired =
		!isReadOnly && accountConfirmationState.confirmRequired;

	// The backend does not return confirmAccountNumber.
	// Use accountNumber when viewing or when it has not changed.
	const confirmAccountValue = confirmRequired
		? confirmAccountNumber
		: accountNumber;

	const confirmAccountError = confirmRequired
		? (errors.confirmAccountNumber ??
			validateConfirmAccountNumber(
				values,
				formContext?.originalAccountNumber ?? "",
			))
		: undefined;

	const doAccountNumbersMatch =
		confirmRequired &&
		Boolean(confirmAccountNumber) &&
		confirmAccountNumber === accountNumber;

	const maskAccountNumber = (value?: string): string | undefined => {
		const digits = (value ?? "").replace(/\D/g, "");
		if (!digits) return undefined;
		if (digits.length <= 6) return digits;
		return `${digits.slice(0, 6)}***`;
	};
	const {
		enclosureErrors,
		isDpdpModalOpen,
		hasAcceptedDpdp,
		hasConfirmedDpdp,
		dpdpError,
		getEnclosureFile,
		getEnclosureFiles,
		isEnclosureRequired,
		handleEnclosureChange,
		handleEnclosureFilesChange,
		handleConditionalFieldChange,
		openDpdpModal,
		closeDpdpModal,
		handleDpdpConsentChange,
		handleAcceptDpdpTerms,
		handleReset,
		handleSaveDraft,
		handleFormAction,
		setHasConfirmedDpdp,
	} = useVendorCreationFormOneController({
		values,
		initialDocuments,
		requireDocuments,
		requireDpdpConsent,
		onChange: resolvedOnChange,
		onNext: resolvedOnNext,
		onSubmit: resolvedOnSubmit,
		onSaveDraft: resolvedOnSaveDraft,
	});

	return (
		<>
			<form
				className="vendor-onboarding-form"
				onSubmit={(event) => event.preventDefault()}
			>
				{submittedMessage ? (
					<div className="vendor-onboarding-form-message">
						<CheckCircle2 aria-hidden="true" size={18} />

						<span>{submittedMessage}</span>
					</div>
				) : null}

				<FormHeader
					title="Vendor Basic Information"
					Icon={LucideBriefcaseBusiness}
				/>

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
						/>
						<FormInput
							mode={fieldMode}
							name="mobile"
							label="Mobile"
							type="tel"
							inputMode="tel"
							autoComplete="tel"
							value={values.mobile ?? ""}
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

						{/* <SelectInput
							mode={fieldMode}
							name="city"
							label="City/ Town"
							placeholder="Select city"
							success={
								fieldMode === "edit" && !errors.city && Boolean(values.city)
							}
							options={getCitiesByState(values.state)}
							value={getCityOption(values.state, values.city)}
							required
							error={errors.city}
							helperText="Vendor city."
							onChange={(option) => {
								resolvedOnChange?.("city", option?.city ?? "");
								if (option?.state && option.state !== values.state) {
									resolvedOnChange?.("state", option.state);
								}
							}}
						/> */}
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

				<FormHeader title="Bank Details" Icon={Landmark} />

				<div className="vendor-onboarding-form-grid">
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
						name="bankAddress"
						label="Address"
						value={values.bankAddress ?? ""}
						error={errors.bankAddress}
						success={
							fieldMode === "edit" &&
							!errors.bankAddress &&
							Boolean(values.bankAddress)
						}
						helperText="Bank branch address."
						onChange={(event) =>
							resolvedOnChange?.("bankAddress", event.target.value)
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
						inputMode="numeric"
						error={errors.accountNumber}
						success={
							!isReadOnly &&
							!errors.accountNumber &&
							Boolean(values.accountNumber)
						}
						helperText="Vendor bank account number."
						onChange={(event) => {
							const value = event.target.value.replace(/\D/g, "");
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
						inputMode="numeric"
						error={errors.confirmAccountNumber}
						success={
							!isReadOnly &&
							!errors.confirmAccountNumber &&
							Boolean(values.confirmAccountNumber) &&
							values.confirmAccountNumber === values.accountNumber
						}
						helperText="Re-enter the bank account number."
						onChange={(event) => {
							const value = event.target.value.replace(/\D/g, "");
							resolvedOnChange?.("confirmAccountNumber", value);
						}}
						onPaste={blockClipboardEvent}
						onCopy={blockClipboardEvent}
						onCut={blockClipboardEvent}
						autoComplete="off"
					/>
				</div>

				<FormHeader title="Tax Details" Icon={Banknote} />

				<div className="vendor-onboarding-form-grid">
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
						value={values.entityRegNo}
						success={
							fieldMode === "edit" &&
							!errors.entityRegNo &&
							Boolean(values.entityRegNo)
						}
						error={errors.entityRegNo}
						helperText="Entity registration number, if applicable."
						onChange={(event) =>
							resolvedOnChange?.("entityRegNo", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Attachments / Enclosures" Icon={ShieldCheck} />

				<div className="vendor-enclosure-upload-grid">
					{VENDOR_DOCUMENT_FIELDS.filter(
						(field) =>
							field.documentType !== "MSME_CERTIFICATE" &&
							field.documentType !== "NDA_CERTIFICATE",
					).map((field) => {
						const isOtherAttachment = field.documentType === "ADDITIONAL_DOC_1";
						const uploadedFile = getEnclosureFile(field.documentType);

						return isOtherAttachment ? (
							<FileUploadField
								key={field.documentType}
								multiple
								value={getEnclosureFiles(field.documentType)}
								onChange={(nextValues) =>
									handleEnclosureFilesChange(field, nextValues)
								}
								maxFiles={10}
								kind="vendorDocument"
								label={field.label}
								description={field.description}
								required={isEnclosureRequired(field)}
								error={enclosureErrors[field.statusKey]}
								readonly={isReadOnly}
								disabled={loading}
								heightClassName="vendor-enclosure-upload-height"
								className="vendor-enclosure-upload-field"
								inputName={field.documentType}
								showActions
								// enableCaption
								// captionLabel="Document caption"
								// captionPlaceholder="Enter a short description for this document"
							/>
						) : (
							<FileUploadField
								key={field.documentType}
								value={uploadedFile}
								onChange={(nextValue) =>
									handleEnclosureChange(field, nextValue)
								}
								kind="vendorDocument"
								label={field.label}
								description={field.description}
								required={isEnclosureRequired(field)}
								error={enclosureErrors[field.statusKey]}
								readonly={isReadOnly}
								disabled={loading}
								heightClassName="vendor-enclosure-upload-height"
								className="vendor-enclosure-upload-field"
								inputName={field.documentType}
								showActions
								// enableCaption
								// captionLabel="Document caption"
								// captionPlaceholder="Enter a short description for this document"
							/>
						);
					})}
				</div>
				<div>
					<FormHeader title="Compliance Documents" Icon={FileCheck2} />

					<div className="vendor-compliance-grid">
						<section className="vendor-compliance-card">
							<div className="vendor-compliance-card-grid">
								<SelectInput
									mode={fieldMode}
									name="msmeVendor"
									label="MSME Vendor"
									placeholder="Select option"
									options={yesNoOptions}
									value={getSelectedOption(
										yesNoOptions,
										toYesNo(values.msmeVendor),
									)}
									required
									error={errors.msmeVendor}
									helperText="Select whether this vendor is registered under MSME."
									onChange={(option) =>
										handleConditionalFieldChange(
											"msmeVendor",
											option?.value ?? "",
										)
									}
								/>

								{values.msmeVendor === "Yes" ? (
									<FileUploadField
										value={getEnclosureFile("MSME_CERTIFICATE")}
										onChange={(nextValue) => {
											const field = VENDOR_DOCUMENT_FIELDS.find(
												(item) => item.documentType === "MSME_CERTIFICATE",
											);

											if (field) {
												handleEnclosureChange(field, nextValue);
											}
										}}
										kind="vendorDocument"
										label="MSME Certificate"
										description="Upload the MSME registration certificate."
										required
										error={enclosureErrors.msmeCertificate}
										readonly={isReadOnly}
										disabled={loading}
										heightClassName="vendor-compliance-upload-height"
										className="vendor-compliance-upload"
										inputName="MSME_CERTIFICATE"
										showActions
										// enableCaption
										// captionLabel="Document caption"
										// captionPlaceholder="Enter a short description for this document"
									/>
								) : null}
							</div>
						</section>

						<section className="vendor-compliance-card">
							<div className="vendor-compliance-card-grid">
								<SelectInput
									mode={fieldMode}
									name="ndaObtained"
									label="Non-Disclosure Undertaking Obtained?"
									placeholder="Select option"
									options={yesNoOptions}
									value={getSelectedOption(
										yesNoOptions,
										toYesNo(values.ndaObtained),
									)}
									error={errors.ndaObtained}
									helperText="Confirm whether NDA is obtained."
									onChange={(option) =>
										handleConditionalFieldChange(
											"ndaObtained",
											option?.value ?? "",
										)
									}
								/>

								{values.ndaObtained === "Yes" ? (
									<FileUploadField
										value={getEnclosureFile("NDA_CERTIFICATE")}
										onChange={(nextValue) => {
											const field = VENDOR_DOCUMENT_FIELDS.find(
												(item) => item.documentType === "NDA_CERTIFICATE",
											);

											if (field) {
												handleEnclosureChange(field, nextValue);
											}
										}}
										kind="vendorDocument"
										label="NDA Certificate"
										description="Upload the signed NDA certificate."
										required
										error={enclosureErrors.ndaCertificate}
										readonly={isReadOnly}
										disabled={loading}
										heightClassName="vendor-compliance-upload-height"
										className="vendor-compliance-upload"
										inputName="NDA_CERTIFICATE"
										showActions
										// enableCaption
										// captionLabel="Document caption"
										// captionPlaceholder="Enter a short description for this document"
									/>
								) : null}
							</div>
						</section>
					</div>
				</div>
				<Modal
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
				</Modal>
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
										onChange={handleDpdpConsentChange}
									/>

									<span>
										I have read and agree to the{" "}
										<button
											type="button"
											className="vendor-dpdp-consent-link"
											disabled={loading}
											onClick={(event) => {
												event.preventDefault();
												openDpdpModal();
											}}
										>
											Digital Personal Data Protection Act
										</button>
										.
									</span>
								</label>

								{dpdpError ? (
									<p className="vendor-dpdp-consent-error" role="alert">
										{dpdpError}
									</p>
								) : null}
							</div>
						) : null}

						<div className="bottom-buttons-bar-between">
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

							<div className="bottom-buttons-bar-between">
								<Button
									type="button"
									text="Reset"
									Icon={RefreshCcw}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={loading}
									onClick={handleReset}
								/>
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
