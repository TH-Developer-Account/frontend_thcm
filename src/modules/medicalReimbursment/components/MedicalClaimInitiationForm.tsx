import { useState } from "react";
import {
	ArrowLeft,
	Download,
	HeartPulse,
	RefreshCcw,
	Send,
	X,
} from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import TabsBar from "../../../components/common/TabsBar";
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
import { FileUploadField } from "../../../components/ui/FileUpload/FileUploadField";
import { MedicalClaimInitiationExcelPreview } from "../components/MedicalClaimInitiationExcelPreview";
import { ImportedMedicalClaimInitiationTable } from "../components/ImportedMedicalClaimInitiationTable";
import MedicalClaimInitiationNextSteps from "../components/MedicalClaimInitiationNextSteps";
import PhoneInput from "../../../components/forms/PhoneInput";
import {
	COUNTRY_CODES,
	DEFAULT_COUNTRY_CODE,
	splitMobile,
} from "../../../utils/phone";

type InitiationTab = "single" | "bulk";

const TABS: ReadonlyArray<{ value: InitiationTab; label: string }> = [
	{ value: "single", label: "Single claim" },
	{ value: "bulk", label: "Bulk import" },
];

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

	const [activeTab, setActiveTab] = useState<InitiationTab>("single");
	const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);

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
		countryCode,
		onSubmitSuccess: onSuccess,
	});
	const {
		importFile,
		importFileError,
		isParsing,
		canImport,
		progress,
		isImporting,
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

	const isBusy = isSubmitting || isImporting;
	const showSingleFields = isViewMode || activeTab === "single";
	const showBulkPanel = !isViewMode && activeTab === "bulk";

	const handleCancel = () => (onCancel ? onCancel() : onBack?.());

	// View mode: the stored mobile is "+<code><number>" (or a legacy bare number).
	const viewPhone = splitMobile(values.mobile);
	const phoneCountryCode = isViewMode ? viewPhone.countryCode : countryCode;
	const maxMobileDigits = phoneCountryCode === DEFAULT_COUNTRY_CODE ? 10 : 15;

	const isSingleDirty = isDirty || countryCode !== DEFAULT_COUNTRY_CODE;
	const handleSingleReset = () => {
		setCountryCode(DEFAULT_COUNTRY_CODE);
		handleReset();
	};

	return (
		<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
			<div className="min-w-0 flex-1">
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
					footer={
						<div className="bottom-buttons-bar-between">
							<Button
								type="button"
								text={isViewMode ? "Back to Listing" : "Cancel"}
								Icon={isViewMode ? ArrowLeft : X}
								iconPosition="left"
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={isBusy}
								onClick={isViewMode ? onBack : handleCancel}
							/>

							<div className="bottom-buttons-bar-between">
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
											disabled={
												isBusy || (showBulkPanel ? !importFile : !isSingleDirty)
											}
											onClick={
												showBulkPanel
													? () => handleImportFileChange(null)
													: handleSingleReset
											}
										/>
										{showBulkPanel ? (
											<Button
												key="bulk-import"
												type="button"
												text={
													isImporting
														? "Importing..."
														: isParsing
															? "Checking file..."
															: "Import & Send Links"
												}
												Icon={Send}
												iconPosition="left"
												size="sm"
												appearance="standard"
												variant="brand"
												disabled={!canImport || isImporting}
												onClick={() => void handleImportFile()}
											/>
										) : (
											<Button
												key="single-submit"
												type="button"
												text={
													isSubmitting
														? "Submitting..."
														: "Initiate & Send Link"
												}
												Icon={Send}
												iconPosition="left"
												size="sm"
												appearance="standard"
												variant="brand"
												disabled={isBusy}
												onClick={() => void handleSubmit()}
											/>
										)}
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
					}
				>
					<form
						className="medical-claim-initiation-form"
						noValidate
						onSubmit={(event) => {
							event.preventDefault();
							if (!isViewMode && activeTab === "single") void handleSubmit();
						}}
					>
						{!isViewMode ? (
							<TabsBar<InitiationTab>
								items={TABS}
								variant="soft"
								active={activeTab}
								ariaLabel="Initiation method"
								className="mb-4"
								// TabsBar has no disabled state: ignore switches while a request runs.
								onChange={(tab) => {
									if (!isBusy) setActiveTab(tab);
								}}
							/>
						) : null}

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

						{showSingleFields ? (
							<div
								id="initiation-panel-single"
								role={isViewMode ? undefined : "tabpanel"}
								className={
									isViewMode
										? "grid grid-cols-1 gap-3 px-2.5 md:grid-cols-3 xl:grid-cols-4"
										: "grid grid-cols-1 gap-3 px-2.5 sm:grid-cols-2"
								}
							>
								<FormInput
									name="employeeName"
									label="Employee Name"
									mode={fieldMode}
									value={values.employeeName}
									required={!isViewMode}
									readOnly={isViewMode}
									disabled={isDetailLoading}
									error={isViewMode ? undefined : errors.employeeName}
									helperText={
										isViewMode ? undefined : "Full name of the employee."
									}
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
									placeholder={isViewMode ? undefined : "e.g. RE10214"}
									helperText={
										isViewMode
											? undefined
											: "The employee's ticket number, for example RE10214."
									}
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
									helperText={
										isViewMode
											? undefined
											: "The secure claim link is sent to this address."
									}
									autoComplete="email"
									onChange={(event) =>
										handleChange("email", event.target.value)
									}
								/>
								<PhoneInput
									name="mobile"
									label="Employee Phone Number"
									mode={fieldMode}
									value={isViewMode ? viewPhone.mobile : values.mobile}
									required={!isViewMode}
									readOnly={isViewMode}
									disabled={isDetailLoading}
									error={isViewMode ? undefined : errors.mobile}
									helperText={
										isViewMode
											? undefined
											: "Select the country code and enter the mobile number."
									}
									maxLength={maxMobileDigits}
									countryCodes={COUNTRY_CODES}
									countryCodeValue={phoneCountryCode}
									countryCodeProps={{
										value: phoneCountryCode,
										onChange: (event) => setCountryCode(event.target.value),
									}}
									onChange={(event) =>
										handleChange(
											"mobile",
											event.target.value
												.replace(/\D/g, "")
												.slice(0, maxMobileDigits),
										)
									}
								/>
							</div>
						) : null}

						{showBulkPanel ? (
							<div
								id="initiation-panel-bulk"
								role="tabpanel"
								className="flex flex-col gap-4 px-2.5"
							>
								<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
									<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
						) : null}
					</form>
					{!isViewMode ? (
						<ImportedMedicalClaimInitiationTable
							progress={progress}
							isImporting={isImporting}
							onClear={clearProgress}
						/>
					) : null}
				</Card>
			</div>
			{!isViewMode ? (
				<MedicalClaimInitiationNextSteps className="w-full lg:w-80 lg:shrink-0 xl:w-88" />
			) : null}
		</div>
	);
};

export default MedicalClaimInitiationForm;
