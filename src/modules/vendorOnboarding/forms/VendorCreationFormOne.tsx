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

type VendorCreationFormOneProps = {
	mode?: VendorFormMode;
	canEdit?: boolean;
	values?: VendorCreationFormOneValues;
	onChange?: <K extends keyof VendorCreationFormOneValues>(
		key: K,
		value: VendorCreationFormOneValues[K],
	) => void;
	onNext?: () => void;
	onSubmit?: () => void;
	errors?: VendorFormErrors<VendorCreationFormOneValues>;
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

const regionOptions = toSelectOptions([
	"South 1",
	"South 2",
	"North",
	"Central",
	"East",
	"West",
	"Corporate",
	"Kharagpur",
	"Dharwad",
	"Jamshedpur",
	"Not Applicable",
]);

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

	return (
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
						required: true,
						helperText: "Enter vendor name in capital letters.",
					})}

					{isReadOnly ? (
						<VendorDetailValue label="Region" value={values.region} required />
					) : (
						<SelectInput
							name="region"
							label="Region"
							placeholder="Select region"
							options={regionOptions}
							value={getSelectedOption(regionOptions, values.region)}
							required
							error={errors.region}
							helperText="Select the applicable vendor region."
							onChange={(option) => onChange?.("region", option?.value ?? "")}
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
					const uploadStatus = uploadedFile ? "Yes" : values[slot.name] || "No";

					return (
						<div className="vendor-enclosure-upload-card" key={slot.name}>
							<FileUploadField
								value={uploadedFile}
								onChange={(fileValue: any) =>
									handleEnclosureChange(slot.name, fileValue)
								}
								kind="document"
								label={slot.label}
								description={slot.description}
								readonly={isReadOnly}
								disabled={loading}
								heightClassName="vendor-enclosure-upload-height"
								className="vendor-enclosure-upload-field"
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

			{isReadOnly ? null : (
				<div className="vendor-onboarding-form-actions">
					<div />

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
							onClick={onSubmit ?? onNext}
							disabled={loading}
						/>
					</div>
				</div>
			)}

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
									{previewFile.sizeLabel || previewFile.type || "Uploaded file"}
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
		</form>
	);
};

export default VendorCreationFormOne;
