import * as React from "react";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import {
	isImageUpload,
	isPdfUpload,
} from "../../../components/ui/FileUpload/fileUpload.helpers";
import FormHeader from "../../marketing/activity-planner/components/common/FormHeader";
import { Modal } from "../../../components/common/Modal";
import {
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
import type {
	VendorCreationFormOneValues,
	VendorFormErrors,
	VendorFormMode,
} from "../types/vendorOnboarding.types";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { STATES } from "../utils/vendor.constant";
import Card from "../../../components/common/Card";

type VendorCreationFormOneProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;
	values: VendorCreationFormOneValues;
	errors: VendorFormErrors<VendorCreationFormOneValues>;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	onNext?: () => void;
	onSubmit?: () => void;
	loading?: boolean;
	submittedMessage?: string;
};

type SelectOption = {
	label: string;
	value: string;
};

type VendorEnclosureStatusKey =
	| "gstCertificate"
	| "panNumber"
	| "bankCancelledCheque"
	| "certificateOfIncorporation"
	| "msmeCertificate"
	| "ndaCertificate";

type VendorEnclosureUploadValues = Partial<
	Record<VendorEnclosureStatusKey, FileUploadValue | null>
>;

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

const yesNoOptions = toSelectOptions(["Yes", "No"]);

const vendorEnclosureUploadSlots: Array<{
	name: VendorEnclosureStatusKey;
	label: string;
	description: string;
}> = [
	{
		name: "gstCertificate",
		label: "GST Certificate",
		description: "PDF / image / DOC",
	},
	{
		name: "panNumber",
		label: "PAN Document",
		description: "PDF / image / DOC",
	},
	{
		name: "bankCancelledCheque",
		label: "Cancelled Cheque",
		description: "PDF / image / DOC",
	},
	{
		name: "certificateOfIncorporation",
		label: "Incorporation Certificate",
		description: "PDF / image / DOC",
	},
	{
		name: "msmeCertificate",
		label: "MSME Certificate",
		description: "PDF / image / DOC",
	},
	{
		name: "ndaCertificate",
		label: "NDA Certificate",
		description: "PDF / image / DOC",
	},
];

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

const VendorCreationFormOne = ({
	mode = "edit",
	canEdit = true,
	values = {},
	onChange,
	onNext,
	onSubmit,
	errors = {},
	loading = false,
	submittedMessage,
}: VendorCreationFormOneProps) => {
	const isReadOnly = mode === "view" || !canEdit;

	const [enclosureUploads, setEnclosureUploads] =
		React.useState<VendorEnclosureUploadValues>({});

	const [previewFile, setPreviewFile] = React.useState<FileUploadValue | null>(
		null,
	);
	const [isDpdpModalOpen, setIsDpdpModalOpen] = React.useState(false);
	const [hasAcceptedDpdp, setHasAcceptedDpdp] = React.useState(false);
	const [hasConfirmedDpdp, setHasConfirmedDpdp] = React.useState(false);
	const [dpdpError, setDpdpError] = React.useState("");

	const renderInput = <K extends keyof VendorCreationFormOneValues>({
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

	const renderYesNo = <K extends keyof VendorCreationFormOneValues>({
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
			<SelectInput
				name={String(name)}
				label={label}
				placeholder="Select option"
				options={yesNoOptions}
				value={getSelectedOption(yesNoOptions, values[name])}
				required={required}
				error={errors[name]}
				helperText={helperText}
				onChange={(option) => onChange?.(name, option?.value ?? "")}
			/>
		);
	};

	const handleEnclosureChange = (
		name: VendorEnclosureStatusKey,
		fileValue: FileUploadValue | null,
	) => {
		setEnclosureUploads((previous) => ({
			...previous,
			[name]: fileValue,
		}));

		onChange?.(name, fileValue ? "Yes" : "No");
	};
	const openDpdpModal = () => {
		setHasConfirmedDpdp(hasAcceptedDpdp);
		setDpdpError("");
		setIsDpdpModalOpen(true);
	};

	const closeDpdpModal = () => {
		setIsDpdpModalOpen(false);
		setHasConfirmedDpdp(false);
	};

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

	const handleFormAction = () => {
		if (!hasAcceptedDpdp) {
			setDpdpError(
				"Please review and accept the Data Privacy Notice before continuing.",
			);
			setIsDpdpModalOpen(true);
			return;
		}

		(onSubmit ?? onNext)?.();
	};
	return (
		<Card
			variant="flat"
			padding="none"
			footer={
				isReadOnly ? null : (
					<div className="w-full">
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
										Digital Personal Data Protection Act (DPDP Act)
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

						<div className="bottom-buttons-bar-between">
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
								text={
									loading
										? onSubmit
											? "Submitting..."
											: "Saving..."
										: onSubmit
											? "Submit Form"
											: "Save & Proceed"
								}
								size="sm"
								appearance="standard"
								variant="brand"
								Icon={Save}
								onClick={handleFormAction}
								disabled={loading || !hasAcceptedDpdp}
							/>
						</div>
					</div>
				)
			}
		>
			<form className="vendor-onboarding-form">
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
						{renderInput({
							name: "vendorName",
							label: "Name Of Vendor",
							required: false,
							helperText: "Enter vendor name in capital letters.",
						})}

						{isReadOnly ? (
							<VendorDetailValue label="State" value={values.state} required />
						) : (
							<SelectInput
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
						)}

						{renderInput({
							name: "city",
							label: "City",
							required: true,
							helperText: "Vendor city.",
						})}

						{renderInput({
							name: "pinCode",
							label: "Pin Code",
							required: true,
							helperText: "Vendor location pin code.",
						})}
					</div>

					<div>
						{isReadOnly ? (
							<VendorDetailValue
								label="Complete Address"
								value={values.completeAddress}
								required
							/>
						) : (
							<TextareaInput
								name="completeAddress"
								label="Complete Address"
								value={values.completeAddress ?? ""}
								required
								error={errors.completeAddress}
								helperText="Registered or communication address."
								onChange={(event) =>
									onChange?.("completeAddress", event.target.value)
								}
							/>
						)}
					</div>
				</div>

				<FormHeader title="Contact Information" Icon={FileCheck2} />

				<div className="vendor-onboarding-form-grid">
					{renderInput({
						name: "mobile",
						label: "Mobile",
						required: true,
						helperText: "Vendor mobile number.",
					})}

					{renderInput({
						name: "email",
						label: "E-mail",
						required: true,
						helperText: "Vendor email address.",
					})}
				</div>

				<FormHeader title="MSME Details" Icon={Building2} />

				<div className="vendor-onboarding-form-grid">
					{renderYesNo({
						name: "msmeVendor",
						label: "MSME Vendor",
						required: true,
						helperText: "Select whether this vendor is registered under MSME.",
					})}

					{renderYesNo({
						name: "msmeCertificateAttached",
						label: 'If "Yes", Certificate Attached?',
						helperText: "Confirm whether MSME certificate is attached.",
					})}
				</div>

				<FormHeader title="Bank Details" Icon={Landmark} />

				<div className="vendor-onboarding-form-grid">
					{renderInput({
						name: "bank",
						label: "Bank",
						required: true,
						helperText: "Bank name.",
					})}

					{renderInput({
						name: "branch",
						label: "Branch",
						required: true,
						helperText: "Bank branch.",
					})}

					{renderInput({
						name: "ifscCode",
						label: "IFSC Code",
						required: true,
						helperText: "Bank IFSC code.",
					})}

					{renderInput({
						name: "bankAddress",
						label: "Address",
						helperText: "Bank branch address.",
					})}

					{renderInput({
						name: "accountNumber",
						label: "A/C No.",
						required: true,
						helperText: "Vendor bank account number.",
					})}
				</div>

				<FormHeader title="Tax Details" Icon={Banknote} />

				<div className="vendor-onboarding-form-grid">
					{renderInput({
						name: "gstin",
						label: "GSTIN",
						required: true,
						helperText: "GST identification number.",
					})}

					{renderInput({
						name: "pan",
						label: "PAN",
						required: true,
						helperText: "Permanent account number.",
					})}

					{renderInput({
						name: "entityRegistrationNumber",
						label: "Entity Reg. No.",
						helperText: "Entity registration number, if applicable.",
					})}
				</div>

				<FormHeader title="Attachments / Enclosures" Icon={ShieldCheck} />

				<div className="vendor-enclosure-upload-grid">
					{vendorEnclosureUploadSlots.map((slot) => {
						const uploadedFile = enclosureUploads[slot.name] ?? null;
						const uploadStatus = uploadedFile
							? "Yes"
							: values[slot.name] || "No";

						return (
							<div className="vendor-enclosure-upload-card" key={slot.name}>
								<FileUploadField
									value={uploadedFile}
									onChange={(fileValue: FileUploadValue | null) =>
										handleEnclosureChange(slot.name, fileValue)
									}
									kind="document"
									label={slot.label}
									description={slot.description}
									readonly={isReadOnly}
									disabled={loading}
									heightClassName="vendor-enclosure-upload-height"
									className="vendor-enclosure-upload-field "
									inputName={slot.name}
								/>

								<div className="vendor-enclosure-upload-footer">
									<span
										className="vendor-enclosure-upload-status"
										data-uploaded={uploadStatus === "Yes"}
									>
										{uploadStatus === "Yes" ? "Uploaded" : "Not uploaded"}
									</span>

									<Button
										type="button"
										text="View"
										Icon={Eye}
										size="sm"
										appearance="ghost"
										variant="secondary"
										onClick={() => setPreviewFile(uploadedFile)}
										disabled={!uploadedFile}
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
									<iframe
										src={previewFile.url}
										title={previewFile.name}
										className="vendor-file-preview-frame"
									/>
								) : (
									<div className="vendor-file-preview-fallback">
										<p>Preview is not available for this file type.</p>

										<Button
											type="button"
											text="Open File"
											Icon={Eye}
											size="sm"
											appearance="standard"
											variant="secondary"
											onClick={() => window.open(previewFile.url, "_blank")}
										/>
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
