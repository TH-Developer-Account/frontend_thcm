import {
	ArrowLeft,
	Download,
	FileUp,
	HeartPulse,
	RefreshCcw,
	Save,
	Send,
	X,
} from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import FormHeader from "../../../components/ui/FormHeader";
import {
	useMedicalClaimInitiation,
	useMedicalClaimInitiationImport,
} from "../hooks/useMedicalClaimInitiation";
import type {
	MedicalClaimInitiationFormMode,
	MedicalClaimInitiationValues,
} from "../types/medicalClaimInitiation.types";
import { Modal } from "../../../components/common/Modal";
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { MedicalClaimInitiationExcelPreview } from "../components/MedicalClaimInitiationExcelPreview";
import { ImportedMedicalClaimInitiationTable } from "../components/ImportedMedicalClaimInitiationTable";

type MedicalClaimInitiationFormProps = {
	claimId?: string;
	mode?: MedicalClaimInitiationFormMode;
	initialValues?: Partial<MedicalClaimInitiationValues>;
	onCancel?: () => void;
	onBack?: () => void;
	onSuccess?: () => void | Promise<void>;
};

const handleDownloadTemplate = (): void => {
	void import("../helpers/generateMedicalClaimInitiationTemplate").then(
		(module) => module.downloadMedicalClaimInitiationTemplate(),
	);
};

const MedicalClaimInitiationForm = ({
	claimId,
	mode,
	initialValues,
	onCancel,
	onBack,
	onSuccess,
}: MedicalClaimInitiationFormProps) => {
	const resolvedMode: MedicalClaimInitiationFormMode =
		mode ?? (claimId ? "view" : "create");
	const isViewMode = resolvedMode === "view";
	const fieldMode = isViewMode ? "view" : "edit";

	const {
		values,
		errors,
		isDirty,
		isSubmitting,
		isResendingLink,
		isDetailLoading,
		handleChange,
		handleReset,
		handleSubmit,
		handleResendLink,
	} = useMedicalClaimInitiation({
		claimId,
		initialValues,
		shouldFetchDetails: isViewMode,
		onSubmitSuccess: onSuccess,
	});
	const {
		isImportModalOpen,
		importFile,
		importFileError,
		progress,
		isImporting,
		openImportModal,
		closeImportModal,
		handleImportFileChange,
		handleImportFile,
		clearProgress,
	} = useMedicalClaimInitiationImport({
		onImportSuccess: async () => {
			await onSuccess?.();
		},
	});
	const canResendLink =
		isViewMode && values.status === "AWAITING_EX_EMPLOYEE" && Boolean(claimId);

	const handleCancel = () => (onCancel ? onCancel() : onBack?.());

	return (
		<Card
			title={
				<FormHeader
					title={
						isViewMode
							? "Medical Claim Initiation Details"
							: "Initiate Medical Claim"
					}
					Icon={HeartPulse}
				/>
			}
			actions={
				!isViewMode ? (
					<>
						<Button
							type="button"
							onClick={handleDownloadTemplate}
							size="sm"
							appearance="standard"
							variant="outline"
							Icon={Download}
							text="Download Template"
						/>

						<Button
							type="button"
							onClick={openImportModal}
							size="sm"
							appearance="standard"
							variant="brand"
							Icon={FileUp}
							text="Import Excel"
						/>
					</>
				) : undefined
			}
		>
			<form
				className="medical-claim-initiation-form"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					if (!isViewMode) void handleSubmit();
				}}
			>
				<div className="flex items-center justify-between gap-3">
					{values.status ? <Badge status={values.status} /> : null}
				</div>

				{values.referenceNumber ? (
					<p className="mb-3 text-sm text-muted">
						Reference:{" "}
						<span className="font-medium text-iron-dark">
							{values.referenceNumber}
						</span>
					</p>
				) : null}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4 px-2.5">
					<FormInput
						name="employeeName"
						label="Employee Name"
						mode={fieldMode}
						value={values.employeeName}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.employeeName}
						autoComplete="name"
						onChange={(event) =>
							handleChange("employeeName", event.target.value)
						}
					/>
					<FormInput
						name="ticketNumber"
						label="Ticket Number"
						mode={fieldMode}
						value={values.ticketNumber}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.ticketNumber}
						onChange={(event) =>
							handleChange("ticketNumber", event.target.value)
						}
					/>
					<FormInput
						name="email"
						label="Employee Email"
						type="email"
						mode={fieldMode}
						value={values.email}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.email}
						autoComplete="email"
						onChange={(event) => handleChange("email", event.target.value)}
					/>
					<FormInput
						name="mobile"
						label="Employee Phone Number"
						type="tel"
						mode={fieldMode}
						value={values.mobile}
						required={!isViewMode}
						readOnly={isViewMode}
						disabled={isDetailLoading}
						error={isViewMode ? undefined : errors.mobile}
						autoComplete="tel"
						maxLength={10}
						onChange={(event) =>
							handleChange(
								"mobile",
								event.target.value.replace(/\D/g, "").slice(0, 10),
							)
						}
					/>
				</div>

				<div className="mt-5 flex items-center justify-between gap-3">
					<Button
						type="button"
						text={isViewMode ? "Back to Listing" : "Cancel"}
						Icon={isViewMode ? ArrowLeft : X}
						iconPosition="left"
						size="sm"
						appearance="standard"
						variant="outline"
						disabled={isSubmitting}
						onClick={isViewMode ? onBack : handleCancel}
					/>

					<div className="flex items-center gap-2">
						{!isViewMode ? (
							<>
								<Button
									type="button"
									text="Reset"
									Icon={RefreshCcw}
									iconPosition="left"
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={!isDirty || isSubmitting}
									onClick={handleReset}
								/>
								<Button
									type="submit"
									text={isSubmitting ? "Submitting..." : "Initiate & Send Link"}
									Icon={Send}
									iconPosition="left"
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={isSubmitting}
								/>
							</>
						) : null}

						{canResendLink ? (
							<Button
								type="button"
								text="Re-Send Link"
								Icon={Send}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="brand"
								disabled={isResendingLink || isDetailLoading}
								onClick={() => void handleResendLink()}
							/>
						) : null}
					</div>
				</div>
			</form>
			{!isViewMode ? (
				<ImportedMedicalClaimInitiationTable
					progress={progress}
					isImporting={isImporting}
					onClear={clearProgress}
				/>
			) : null}
			<Modal
				open={isImportModalOpen}
				title="Import Medical Claim Initiations"
				size="xl"
				onClose={closeImportModal}
				footer_actions={
					<>
						<Button
							type="button"
							text="Cancel"
							Icon={X}
							appearance="standard"
							variant="outline"
							size="sm"
							onClick={closeImportModal}
							disabled={isImporting}
						/>

						<Button
							type="button"
							text={isImporting ? "Importing..." : "Import"}
							Icon={Save}
							appearance="standard"
							variant="brand"
							size="sm"
							onClick={() => void handleImportFile()}
							disabled={!importFile?.file || isImporting}
						/>
					</>
				}
			>
				<div className="flex flex-col gap-4 p-5">
					<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div>
								<p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
									Expected format
								</p>

								<p className="mt-1 text-xs text-zinc-500">
									Do not rename or remove any template columns.
								</p>
							</div>

							<Button
								type="button"
								onClick={handleDownloadTemplate}
								size="sm"
								appearance="standard"
								variant="outline"
								Icon={Download}
								text="Download Template"
							/>
						</div>

						<MedicalClaimInitiationExcelPreview />
					</div>

					<FileUploadField
						value={importFile}
						onChange={handleImportFileChange}
						kind="spreadsheet"
						label="Upload Excel File"
						description="Supported formats: XLSX, XLS and CSV"
						required
						error={importFileError}
						disabled={isImporting}
					/>
				</div>
			</Modal>
		</Card>
	);
};

export default MedicalClaimInitiationForm;
