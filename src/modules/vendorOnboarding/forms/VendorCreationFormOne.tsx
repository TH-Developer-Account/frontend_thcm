import * as React from "react";
import {
	ArrowLeft,
	Banknote,
	Building2,
	CheckCircle2,
	Eye,
	FileCheck2,
	Landmark,
	LucideBriefcaseBusiness,
	RefreshCcw,
	Save,
	ShieldCheck,
	X,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";

import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import {
	isImageUpload,
	isPdfUpload,
} from "../../../components/ui/FileUpload/fileUpload.helpers";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";

import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorDocumentField,
	type VendorDocumentType,
	type VendorEnclosureStatusKey,
	type VendorFormErrors,
	type VendorFormMode,
	type VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";

import { STATES } from "../utils/vendor.constant";

const EMPTY_VENDOR_DOCUMENTS: VendorOnboardingDocument[] = [];

type SelectOption = {
	label: string;
	value: string;
};

export type VendorEnclosureUploadItem = {
	statusKey: VendorEnclosureStatusKey;
	documentType: VendorDocumentType;
	value: FileUploadValue | null;
};

export type VendorCreationFormOneSubmission = {
	dpdpConsent: true;
	enclosureUploads: VendorEnclosureUploadItem[];
};

type VendorCreationFormOneProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;

	values: VendorCreationFormOneValues;
	errors: VendorFormErrors<VendorCreationFormOneValues>;

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

const yesNoOptions = toSelectOptions(["Yes", "No"]);

const getFileNameFromUrl = (
	fileUrl: string,
	documentType: VendorDocumentType,
): string => {
	try {
		const url = new URL(fileUrl);
		const fileName = url.pathname.split("/").pop();

		return fileName || documentType;
	} catch {
		return fileUrl.split("/").pop() || documentType;
	}
};

const getFileExtension = (fileName: string): string =>
	fileName.split(".").pop()?.toLowerCase() ?? "";

const getMimeType = (fileName: string): string => {
	const extension = getFileExtension(fileName);

	switch (extension) {
		case "pdf":
			return "application/pdf";

		case "jpg":
		case "jpeg":
			return "image/jpeg";

		case "png":
			return "image/png";

		case "webp":
			return "image/webp";

		case "doc":
			return "application/msword";

		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

		default:
			return "";
	}
};

const createInitialEnclosureUploads = (
	initialDocuments: VendorOnboardingDocument[] = [],
): VendorEnclosureUploadItem[] =>
	VENDOR_DOCUMENT_FIELDS.map((field) => {
		const document = initialDocuments.find(
			(item) => item.documentType === field.documentType,
		);

		if (!document) {
			return {
				statusKey: field.statusKey,
				documentType: field.documentType,
				value: null,
			};
		}

		const fileName =
			document.fileName ||
			getFileNameFromUrl(document.fileUrl, document.documentType);

		return {
			statusKey: field.statusKey,
			documentType: field.documentType,

			value: {
				id: document.id,
				file: null,
				url: document.fileUrl,
				name: fileName,
				type: document.mimeType || getMimeType(fileName),
				size: document.size ?? 0,
				extension: getFileExtension(fileName),
				sizeLabel: document.size
					? `${(document.size / 1024).toFixed(1)} KB`
					: "",
				isLocal: false,
			},
		};
	});

const VendorCreationFormOne = ({
	mode = "edit",
	canEdit = true,
	values,
	onChange,
	onNext,
	onBack,
	onSubmit,
	errors,
	initialDocuments = EMPTY_VENDOR_DOCUMENTS,
	requireDocuments = true,
	requireDpdpConsent = true,
	loading = false,
	submittedMessage,
	actionText,
}: VendorCreationFormOneProps) => {
	const isReadOnly = mode === "view" || !canEdit;
	const fieldMode: VendorFormMode = isReadOnly ? "view" : "edit";

	const [enclosureUploads, setEnclosureUploads] = React.useState<
		VendorEnclosureUploadItem[]
	>(() => createInitialEnclosureUploads(initialDocuments));

	const [enclosureErrors, setEnclosureErrors] = React.useState<
		Partial<Record<VendorEnclosureStatusKey, string>>
	>({});

	const [previewFile, setPreviewFile] = React.useState<FileUploadValue | null>(
		null,
	);

	const [isDpdpModalOpen, setIsDpdpModalOpen] = React.useState(false);
	const [hasAcceptedDpdp, setHasAcceptedDpdp] = React.useState(false);
	const [hasConfirmedDpdp, setHasConfirmedDpdp] = React.useState(false);
	const [dpdpError, setDpdpError] = React.useState("");

	const documentsKey = React.useMemo(
		() =>
			initialDocuments
				.map(
					(document) =>
						`${document.id}:${document.documentType}:${document.fileUrl}`,
				)
				.sort()
				.join("|"),
		[initialDocuments],
	);

	const syncedDocumentsKeyRef = React.useRef("");

	React.useEffect(() => {
		if (syncedDocumentsKeyRef.current === documentsKey) {
			return;
		}

		syncedDocumentsKeyRef.current = documentsKey;

		setEnclosureUploads(createInitialEnclosureUploads(initialDocuments));
	}, [documentsKey, initialDocuments]);

	const getEnclosureFile = React.useCallback(
		(documentType: VendorDocumentType): FileUploadValue | null =>
			enclosureUploads.find((upload) => upload.documentType === documentType)
				?.value ?? null,
		[enclosureUploads],
	);

	const handleEnclosureChange = React.useCallback(
		(field: VendorDocumentField, nextValue: FileUploadValue | null) => {
			setEnclosureUploads((previousUploads) =>
				previousUploads.map((upload) =>
					upload.documentType === field.documentType
						? {
								...upload,
								value: nextValue,
							}
						: upload,
				),
			);

			setEnclosureErrors((previousErrors) => {
				const nextErrors = { ...previousErrors };

				delete nextErrors[field.statusKey];

				return nextErrors;
			});

			onChange?.(field.statusKey, nextValue ? "Yes" : "No");
		},
		[onChange],
	);

	const validateEnclosures = React.useCallback((): boolean => {
		if (!requireDocuments) {
			setEnclosureErrors({});
			return true;
		}

		const nextErrors: Partial<Record<VendorEnclosureStatusKey, string>> = {};

		VENDOR_DOCUMENT_FIELDS.forEach((field) => {
			if (!field.required) {
				return;
			}

			const upload = enclosureUploads.find(
				(item) => item.documentType === field.documentType,
			);

			const hasUploadedFile = Boolean(
				upload?.value?.file || upload?.value?.url,
			);

			if (!hasUploadedFile) {
				nextErrors[field.statusKey] = `${field.label} is required.`;
			}
		});

		setEnclosureErrors(nextErrors);

		return Object.keys(nextErrors).length === 0;
	}, [enclosureUploads, requireDocuments]);

	const openDpdpModal = React.useCallback(() => {
		setHasConfirmedDpdp(hasAcceptedDpdp);
		setDpdpError("");
		setIsDpdpModalOpen(true);
	}, [hasAcceptedDpdp]);

	const closeDpdpModal = React.useCallback(() => {
		setIsDpdpModalOpen(false);
		setHasConfirmedDpdp(false);
	}, []);

	const handleDpdpConsentChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		if (event.target.checked) {
			openDpdpModal();
			return;
		}

		setHasAcceptedDpdp(false);
		setHasConfirmedDpdp(false);
		setDpdpError("");
	};

	const handleAcceptDpdpTerms = () => {
		if (!hasConfirmedDpdp) {
			return;
		}

		setHasAcceptedDpdp(true);
		setDpdpError("");
		setIsDpdpModalOpen(false);
	};

	const handleReset = () => {
		syncedDocumentsKeyRef.current = documentsKey;

		setEnclosureUploads(createInitialEnclosureUploads(initialDocuments));
		setEnclosureErrors({});
		setHasAcceptedDpdp(false);
		setHasConfirmedDpdp(false);
		setDpdpError("");
		setPreviewFile(null);
	};

	const handleFormAction = () => {
		const enclosuresValid = validateEnclosures();

		if (!enclosuresValid) {
			return;
		}

		if (requireDpdpConsent && !hasAcceptedDpdp) {
			setDpdpError(
				"Please review and accept the Data Privacy Notice before continuing.",
			);

			setIsDpdpModalOpen(true);
			return;
		}

		if (onSubmit) {
			void onSubmit({
				dpdpConsent: true,
				enclosureUploads,
			});

			return;
		}

		onNext?.();
	};

	return (
		<Card
			footer={
				isReadOnly ? (
					onNext ? (
						<div className="vendor-onboarding-form-actions">
							<Button
								type="button"
								text={actionText || "Next"}
								size="sm"
								appearance="standard"
								variant="brand"
								onClick={onNext}
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
								onClick={onBack}
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

								<Button
									type="button"
									text={
										loading
											? onSubmit
												? "Submitting..."
												: "Saving..."
											: actionText ||
												(onSubmit ? "Submit Form" : "Save & Proceed")
									}
									size="sm"
									appearance="standard"
									variant="brand"
									Icon={Save}
									onClick={handleFormAction}
									disabled={loading || (requireDpdpConsent && !hasAcceptedDpdp)}
								/>
							</div>
						</div>
					</div>
				)
			}
		>
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
							helperText="Enter vendor name in capital letters."
							onChange={(event) => onChange?.("vendorName", event.target.value)}
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
							helperText="Select the applicable vendor state."
							onChange={(option) => onChange?.("state", option?.value ?? "")}
						/>

						<FormInput
							mode={fieldMode}
							name="city"
							label="City"
							value={values.city ?? ""}
							required
							error={errors.city}
							helperText="Vendor city."
							onChange={(event) => onChange?.("city", event.target.value)}
						/>

						<FormInput
							mode={fieldMode}
							name="pinCode"
							label="Pin Code"
							value={values.pinCode ?? ""}
							required
							inputMode="numeric"
							error={errors.pinCode}
							helperText="Vendor location pin code."
							onChange={(event) => onChange?.("pinCode", event.target.value)}
						/>
					</div>

					<div>
						<TextareaInput
							mode={fieldMode}
							name="completeAddress"
							label="Complete Address"
							value={values.completeAddress ?? ""}
							required
							error={errors.completeAddress}
							helperText="Registered or communication address."
							onChange={(event) =>
								onChange?.("completeAddress", event.target.value)
							}
							rows={4}
						/>
					</div>
				</div>

				<FormHeader title="Contact Information" Icon={FileCheck2} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						mode={fieldMode}
						name="mobile"
						label="Mobile"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						value={values.mobile ?? ""}
						required
						error={errors.mobile}
						helperText="Vendor mobile number."
						onChange={(event) => onChange?.("mobile", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="email"
						label="E-mail"
						type="email"
						autoComplete="email"
						value={values.email ?? ""}
						required
						error={errors.email}
						helperText="Vendor email address."
						onChange={(event) => onChange?.("email", event.target.value)}
					/>
				</div>

				<FormHeader title="MSME Details" Icon={Building2} />

				<div className="vendor-onboarding-form-grid">
					<SelectInput
						mode={fieldMode}
						name="msmeVendor"
						label="MSME Vendor"
						placeholder="Select option"
						options={yesNoOptions}
						value={getSelectedOption(yesNoOptions, values.msmeVendor)}
						required
						error={errors.msmeVendor}
						helperText="Select whether this vendor is registered under MSME."
						onChange={(option) => onChange?.("msmeVendor", option?.value ?? "")}
					/>

					<SelectInput
						mode={fieldMode}
						name="msmeCertificateAttached"
						label={'If "Yes", Certificate Attached?'}
						placeholder="Select option"
						options={yesNoOptions}
						value={getSelectedOption(
							yesNoOptions,
							values.msmeCertificateAttached,
						)}
						error={errors.msmeCertificateAttached}
						helperText="Confirm whether MSME certificate is attached."
						onChange={(option) =>
							onChange?.("msmeCertificateAttached", option?.value ?? "")
						}
					/>
				</div>

				<FormHeader title="Bank Details" Icon={Landmark} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						mode={fieldMode}
						name="bank"
						label="Bank"
						value={values.bank ?? ""}
						required
						error={errors.bank}
						helperText="Bank name."
						onChange={(event) => onChange?.("bank", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="branch"
						label="Branch"
						value={values.branch ?? ""}
						required
						error={errors.branch}
						helperText="Bank branch."
						onChange={(event) => onChange?.("branch", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="ifscCode"
						label="IFSC Code"
						value={values.ifscCode ?? ""}
						required
						error={errors.ifscCode}
						helperText="Bank IFSC code."
						onChange={(event) => onChange?.("ifscCode", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="bankAddress"
						label="Address"
						value={values.bankAddress ?? ""}
						error={errors.bankAddress}
						helperText="Bank branch address."
						onChange={(event) => onChange?.("bankAddress", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="accountNumber"
						label="A/C No."
						value={values.accountNumber ?? ""}
						required
						inputMode="numeric"
						error={errors.accountNumber}
						helperText="Vendor bank account number."
						onChange={(event) =>
							onChange?.("accountNumber", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Tax Details" Icon={Banknote} />

				<div className="vendor-onboarding-form-grid">
					<FormInput
						mode={fieldMode}
						name="gstin"
						label="GSTIN"
						value={values.gstin ?? ""}
						required
						error={errors.gstin}
						helperText="GST identification number."
						onChange={(event) => onChange?.("gstin", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="pan"
						label="PAN"
						value={values.pan ?? ""}
						required
						error={errors.pan}
						helperText="Permanent account number."
						onChange={(event) => onChange?.("pan", event.target.value)}
					/>

					<FormInput
						mode={fieldMode}
						name="entityRegistrationNumber"
						label="Entity Reg. No."
						value={values.entityRegistrationNumber ?? ""}
						error={errors.entityRegistrationNumber}
						helperText="Entity registration number, if applicable."
						onChange={(event) =>
							onChange?.("entityRegistrationNumber", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Attachments / Enclosures" Icon={ShieldCheck} />

				<div className="vendor-enclosure-upload-grid">
					{VENDOR_DOCUMENT_FIELDS.map((field) => {
						const uploadedFile = getEnclosureFile(field.documentType);
						const isUploaded = Boolean(uploadedFile?.url);

						return (
							<div
								className="vendor-enclosure-upload-card"
								key={field.documentType}
							>
								<FileUploadField
									value={uploadedFile}
									onChange={(nextValue) =>
										handleEnclosureChange(field, nextValue)
									}
									kind="document"
									label={field.label}
									description={field.description}
									required={requireDocuments && field.required}
									error={enclosureErrors[field.statusKey]}
									readonly={isReadOnly}
									disabled={loading}
									heightClassName="vendor-enclosure-upload-height"
									className="vendor-enclosure-upload-field"
									inputName={field.documentType}
									showActions
								/>

								<div className="vendor-enclosure-upload-footer">
									<span
										className="vendor-enclosure-upload-status"
										data-uploaded={isUploaded}
									>
										{isUploaded ? "Uploaded" : "Not uploaded"}
									</span>

									<Button
										type="button"
										text="View"
										Icon={Eye}
										size="sm"
										appearance="ghost"
										variant="secondary"
										onClick={() => {
											if (uploadedFile?.url) {
												setPreviewFile(uploadedFile);
											}
										}}
										disabled={!uploadedFile?.url}
									/>
								</div>
							</div>
						);
					})}
				</div>

				{previewFile ? (
					<div
						className="vendor-file-preview-modal-overlay"
						role="presentation"
						onMouseDown={() => setPreviewFile(null)}
					>
						<div
							className="vendor-file-preview-modal"
							role="dialog"
							aria-modal="true"
							aria-label="Uploaded file preview"
							onMouseDown={(event) => event.stopPropagation()}
						>
							<div className="vendor-file-preview-modal-header">
								<div className="vendor-file-preview-modal-title-wrap">
									<h3 className="vendor-file-preview-modal-title">
										{previewFile.name}
									</h3>

									<p className="vendor-file-preview-modal-meta">
										{previewFile.sizeLabel ||
											previewFile.type ||
											"Uploaded file"}
									</p>
								</div>

								<Button
									type="button"
									appearance="icon"
									variant="secondary"
									size="sm"
									Icon={X}
									aria-label="Close file preview"
									onClick={() => setPreviewFile(null)}
								/>
							</div>

							<div className="vendor-file-preview-modal-body">
								{isImageUpload(previewFile) ? (
									<img
										src={previewFile.url}
										alt={previewFile.name}
										className="vendor-file-preview-image"
									/>
								) : isPdfUpload(previewFile) ? (
									<object
										data={previewFile.url}
										type="application/pdf"
										className="vendor-file-preview-frame"
										aria-label={previewFile.name}
									>
										<div className="vendor-file-preview-fallback">
											<p>PDF preview is unavailable.</p>

											<Button
												type="button"
												text="Open PDF"
												Icon={Eye}
												size="sm"
												appearance="standard"
												variant="secondary"
												onClick={() =>
													window.open(
														previewFile.url,
														"_blank",
														"noopener,noreferrer",
													)
												}
											/>
										</div>
									</object>
								) : (
									<div className="vendor-file-preview-fallback">
										<p>Preview is not available for this file type.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				) : null}

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
			</form>
		</Card>
	);
};

export default VendorCreationFormOne;
