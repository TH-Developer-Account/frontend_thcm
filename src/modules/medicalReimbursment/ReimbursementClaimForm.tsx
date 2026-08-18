import { useState, type ChangeEvent } from "react";
import {
	Activity,
	ArrowLeft,
	BadgeIndianRupee,
	Building2,
	CheckCircle2,
	Eye,
	FilePenLine,
	HeartPulse,
	ReceiptText,
	RefreshCcw,
	Save,
	Stethoscope,
	UserRound,
} from "lucide-react";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/forms/FormInput";
import TextareaInput from "../../components/forms/TextareaInput";
import FormHeader from "../../components/ui/FormHeader";

import ApprovalSection from "./ApprovalSection";
import {
	sanitizeAmountInput,
	sanitizeWholeNumberInput,
	useReimbursementClaimForm,
	deriveClaimStatusLabel,
} from "./useReimbursementClaimForm";
import type {
	ApprovalActionType,
	ApprovalStage,
	ReimbursementClaimAttachments,
	ReimbursementClaimFormMode,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";
import { FileUploadField } from "../../components/ui/FileUpload/FileUploadField";
import Checkbox from "../../components/forms/Checkbox";
import { useNavigate } from "react-router-dom";
import DatePickerInput from "../../components/common/DatePickerInput";

interface ReimbursementClaimFormProps {
	mode?: ReimbursementClaimFormMode;
	canEdit?: boolean;
	showOfficeUse?: boolean;
	canEditOfficeUse?: boolean;
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	onBack?: () => void;
	submittedMessage?: string;
	actionText?: string;
	/**
	 * Approval workflow is rendered here but owned by the parent page — pass
	 * the stages you've fetched (e.g. from the workflow module) and handle
	 * the callback the same way you already handle onSubmit/onSaveDraft.
	 */
	approvalStages?: ApprovalStage[];
	canApprove?: boolean;
	onApprovalAction?: (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => void | Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const ReimbursementClaimForm = ({
	mode = "edit",
	canEdit = true,
	showOfficeUse = false,
	canEditOfficeUse = false,
	initialValues,
	initialAttachments,
	onSubmit,
	onSaveDraft,
	onBack,
	submittedMessage,
	actionText = "Submit Claim",
	approvalStages = [],
	canApprove = false,
	onApprovalAction,
}: ReimbursementClaimFormProps) => {
	const {
		values,
		attachments,
		errors,
		categoryTotals,
		claimedTotal,
		officeApprovedTotal,
		isLoading,
		isSubmitting,
		isSavingDraft,
		mutationError,
		handleChange,
		handleAttachmentsChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	} = useReimbursementClaimForm({
		initialValues,
		initialAttachments,
		onSubmit,
		onSaveDraft,
	});

	const navigate = useNavigate();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const isReadOnly = mode === "view" || !canEdit;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";
	const officeFieldMode: ReimbursementClaimFormMode =
		mode === "view" || !canEditOfficeUse ? "view" : "edit";

	const amountChange =
		(field: keyof ReimbursementClaimFormValues) =>
		(event: ChangeEvent<HTMLInputElement>): void => {
			handleChange(field, sanitizeAmountInput(event.target.value));
		};

	const wholeNumberChange =
		(field: keyof ReimbursementClaimFormValues) =>
		(event: ChangeEvent<HTMLInputElement>): void => {
			handleChange(field, sanitizeWholeNumberInput(event.target.value));
		};

	const hasActions = !isReadOnly && Boolean(onSubmit || onSaveDraft || onBack);
	const claimStatusLabel = deriveClaimStatusLabel(approvalStages);

	const handleBackToView = () => {
		navigate("/medical-claim/form/view", {
			replace: true,
		});
	};

	return (
		<Card
			title={
				<div className="flex items-center justify-between gap-3">
					<p className="text-xs font-bold uppercase tracking-widest text-brand">
						Tata Hitachi Construction Machinery Company Private Limited
					</p>
					{approvalStages.length > 0 ? (
						<span className="shrink-0 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-iron-dark">
							{claimStatusLabel}
						</span>
					) : null}
				</div>
			}
			secondaryHeader={
				<>
					<div>
						<h1 className="mt-1 text-xl font-semibold tracking-tight text-iron-dark">
							Non-Hospitalisation Claim Form
						</h1>
						<p className="mt-1 text-sm text-muted text-wrap">
							Complete the employee and treatment details below, and attach
							supporting documents against each claim head. Fields marked
							required must be completed before submission.
						</p>
					</div>
					<Button
						onClick={handleBackToView}
						text="View Form"
						size="sm"
						appearance="standard"
						variant="outline"
					/>
				</>
			}
			footer={
				hasActions ? (
					<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							{onBack ? (
								<Button
									type="button"
									text="Back"
									Icon={ArrowLeft}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={isLoading}
									onClick={onBack}
								/>
							) : null}
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Button
								type="button"
								text="Reset"
								Icon={RefreshCcw}
								size="sm"
								appearance="standard"
								variant="outline"
								disabled={isLoading}
								onClick={handleReset}
							/>

							{onSaveDraft ? (
								<Button
									type="button"
									text={isSavingDraft ? "Saving..." : "Save as Draft"}
									Icon={FilePenLine}
									size="sm"
									appearance="standard"
									variant="outline"
									disabled={isLoading}
									onClick={handleSaveDraft}
								/>
							) : null}

							{onSubmit ? (
								<Button
									type="button"
									text={isSubmitting ? "Submitting..." : actionText}
									Icon={Save}
									size="sm"
									appearance="standard"
									variant="brand"
									disabled={isLoading}
									onClick={handleSubmit}
								/>
							) : null}
						</div>
					</div>
				) : null
			}
		>
			<form
				className="flex flex-col gap-5"
				noValidate
				onSubmit={(event) => event.preventDefault()}
			>
				{submittedMessage ? (
					<div
						className="flex items-start gap-2 rounded-md border border-border bg-page p-3 text-sm text-iron"
						role="status"
					>
						<CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
						<span>{submittedMessage}</span>
					</div>
				) : null}

				{mutationError ? (
					<div
						className="rounded-md border border-border bg-page p-3 text-sm text-iron"
						role="alert"
					>
						{mutationError}
					</div>
				) : null}

				<FormHeader title="Employee and Patient Details" Icon={UserRound} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					<FormInput
						mode={fieldMode}
						name="ticketNumberOrGrade"
						label="Ticket Number / Grade"
						value={values.ticketNumberOrGrade}
						required
						error={errors.ticketNumberOrGrade}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("ticketNumberOrGrade", event.target.value)
						}
					/>
					<FormInput
						mode={fieldMode}
						name="employeeName"
						label="Name of Employee"
						value={values.employeeName}
						required
						error={errors.employeeName}
						autoComplete="name"
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("employeeName", event.target.value)
						}
					/>

					<FormInput
						mode={fieldMode}
						name="location"
						label="Location"
						value={values.location}
						required
						error={errors.location}
						helperText="Employee work location."
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("location", event.target.value)
						}
					/>
					<FormInput
						mode={fieldMode}
						name="patientName"
						label="Name of Patient"
						value={values.patientName}
						required
						error={errors.patientName}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("patientName", event.target.value)
						}
					/>

					<FormInput
						mode={fieldMode}
						name="relationshipWithEmployee"
						label="Relationship with Employee"
						value={values.relationshipWithEmployee}
						required
						error={errors.relationshipWithEmployee}
						helperText="For example: Self, spouse, child or dependent."
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							handleChange("relationshipWithEmployee", event.target.value)
						}
					/>
				</div>

				<FormHeader title="Domiciliary Details" Icon={Building2} />

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<FormInput
						mode={fieldMode}
						name="medicalAdvanceAmount"
						label="Medical Advance Taken"
						placeholder="0.00"
						type="number"
						value={values.medicalAdvanceAmount}
						inputMode="decimal"
						error={errors.medicalAdvanceAmount}
						helperText="Enter amount in rupees, if applicable."
						onChange={amountChange("medicalAdvanceAmount")}
					/>

					<FormInput
						mode={fieldMode}
						name="companySettledAmount"
						label="Amount Already Settled This Calendar Year"
						value={values.companySettledAmount}
						inputMode="decimal"
						placeholder="0.00"
						type="number"
						error={errors.companySettledAmount}
						helperText="Enter amount in rupees, if applicable."
						onChange={amountChange("companySettledAmount")}
					/>
				</div>

				<TextareaInput
					mode={fieldMode}
					name="descriptionOfIllness"
					label="Description of Illness / Treatment"
					value={values.descriptionOfIllness}
					required
					error={errors.descriptionOfIllness}
					helperText="Include the illness, treatment and relevant medical context."
					rows={4}
					onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
						handleChange("descriptionOfIllness", event.target.value)
					}
				/>

				<FormHeader title="Claim Heads" Icon={Stethoscope} />

				<Card
					title={
						<div className="flex items-center gap-2">
							<Stethoscope
								size={18}
								className="text-brand"
								aria-hidden="true"
							/>
							<span>A. Visit Fees</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(categoryTotals.visitFees)}
							</span>
						</p>
					}
				>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
							<FormInput
								mode={fieldMode}
								name="numberOfVisits"
								label="Number of Visits"
								value={values.numberOfVisits}
								inputMode="numeric"
								error={errors.numberOfVisits}
								helperText="Include visits to a dispensary."
								onChange={wholeNumberChange("numberOfVisits")}
							/>

							<FormInput
								mode={fieldMode}
								name="visitFeePerVisit"
								label="Fee per Visit"
								value={values.visitFeePerVisit}
								inputMode="decimal"
								error={errors.visitFeePerVisit}
								helperText="Amount in rupees."
								onChange={amountChange("visitFeePerVisit")}
							/>

							<FormInput
								mode="view"
								name="visitFeesClaimedTotal"
								label="Amount Claimed"
								value={currencyFormatter.format(categoryTotals.visitFees)}
								helperText="Calculated from visits × fee per visit."
							/>
						</div>

						<FileUploadField
							kind="document"
							multiple
							label="Consultation Receipts"
							// helperText="Attach receipts for each visit, including dispensary visits."
							value={attachments.visitFees}
							readonly={isReadOnly}
							onChange={(files) => handleAttachmentsChange("visitFees", files)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<Activity size={18} className="text-brand" aria-hidden="true" />
							<span>B. Medicines and Investigations</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(categoryTotals.medical)}
							</span>
						</p>
					}
				>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							<FormInput
								mode={fieldMode}
								name="doctorMedicineAmount"
								label="Medicines Prescribed by Doctor"
								value={values.doctorMedicineAmount}
								inputMode="decimal"
								error={errors.doctorMedicineAmount}
								helperText="Amount in rupees."
								onChange={amountChange("doctorMedicineAmount")}
							/>

							<FormInput
								mode={fieldMode}
								name="injectionInvestigationAmount"
								label="Injections / Investigations"
								value={values.injectionInvestigationAmount}
								inputMode="decimal"
								error={errors.injectionInvestigationAmount}
								helperText="Amount in rupees."
								onChange={amountChange("injectionInvestigationAmount")}
							/>

							<FormInput
								mode={fieldMode}
								name="ecgXrayOtherAmount"
								label="ECG / X-Ray / Other"
								value={values.ecgXrayOtherAmount}
								inputMode="decimal"
								error={errors.ecgXrayOtherAmount}
								helperText="Amount in rupees."
								onChange={amountChange("ecgXrayOtherAmount")}
							/>

							<FormInput
								mode="view"
								name="medicalClaimedTotal"
								label="Amount Claimed"
								value={currencyFormatter.format(categoryTotals.medical)}
							/>
						</div>

						<FileUploadField
							kind="document"
							multiple
							label="Pharmacy Bills and Investigation Reports"
							value={attachments.medical}
							readonly={isReadOnly}
							onChange={(files) => handleAttachmentsChange("medical", files)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<Eye size={18} className="text-brand" aria-hidden="true" />
							<span>C. Ophthalmic Treatment</span>
						</div>
					}
					secondaryHeader={
						<p className="text-sm text-muted">
							Claimed amount:{" "}
							<span className="font-semibold text-iron-dark">
								{currencyFormatter.format(categoryTotals.ophthalmic)}
							</span>
						</p>
					}
				>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<FormInput
								mode={fieldMode}
								name="lensCost"
								label="Cost of Lenses"
								value={values.lensCost}
								inputMode="decimal"
								error={errors.lensCost}
								onChange={amountChange("lensCost")}
							/>

							<FormInput
								mode={fieldMode}
								name="frameCost"
								label="Cost of Frame"
								value={values.frameCost}
								inputMode="decimal"
								error={errors.frameCost}
								onChange={amountChange("frameCost")}
							/>

							<FormInput
								mode="view"
								name="ophthalmicClaimedTotal"
								label="Amount Claimed"
								value={currencyFormatter.format(categoryTotals.ophthalmic)}
							/>
						</div>

						<FileUploadField
							kind="document"
							multiple
							label="Optician Invoice and Prescription"
							// helperText="As permitted by company policy."
							value={attachments.ophthalmic}
							readonly={isReadOnly}
							onChange={(files) => handleAttachmentsChange("ophthalmic", files)}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<HeartPulse size={18} className="text-brand" aria-hidden="true" />
							<span>D. Executive Health Check-up</span>
						</div>
					}
				>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<FormInput
								mode={fieldMode}
								name="patientAge"
								label="Age"
								value={values.patientAge}
								inputMode="numeric"
								error={errors.patientAge}
								onChange={wholeNumberChange("patientAge")}
							/>
							{/* 
							<FormInput
								mode={fieldMode}
								type="date"
								name="lastHealthCheckupDate"
								label="Last Health Check-up Date"
								value={values.lastHealthCheckupDate}
								error={errors.lastHealthCheckupDate}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("lastHealthCheckupDate", event.target.value)
								}
							/> */}
							<DatePickerInput
								mode="single"
								label="Last Health Check-up Date"
								value={selectedDate}
								disablePast
								onChange={(nextValue) => {
									setSelectedDate(
										nextValue instanceof Date ? nextValue : undefined,
									);
								}}
							/>

							<FormInput
								mode={fieldMode}
								name="healthCheckupAmount"
								label="Amount Claimed"
								value={values.healthCheckupAmount}
								inputMode="decimal"
								error={errors.healthCheckupAmount}
								helperText="As permitted by company policy."
								onChange={amountChange("healthCheckupAmount")}
							/>
						</div>

						<FileUploadField
							kind="document"
							multiple
							label="Health Check-up Report"
							value={attachments.healthCheckup}
							readonly={isReadOnly}
							onChange={(files) =>
								handleAttachmentsChange("healthCheckup", files)
							}
						/>
					</div>
				</Card>

				<Card
					title={
						<div className="flex items-center gap-2">
							<ReceiptText
								size={18}
								className="text-brand"
								aria-hidden="true"
							/>
							<span>E. Excess Hospitalisation Claims</span>
						</div>
					}
				>
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<FormInput
								mode={fieldMode}
								name="excessHospitalizationAmount"
								label="Amount Claimed"
								value={values.excessHospitalizationAmount}
								inputMode="decimal"
								error={errors.excessHospitalizationAmount}
								helperText="Enter only the eligible excess amount."
								onChange={amountChange("excessHospitalizationAmount")}
							/>
						</div>

						<FileUploadField
							kind="document"
							multiple
							label="Discharge Summary and Hospital Bills"
							value={attachments.excessHospitalization}
							readonly={isReadOnly}
							onChange={(files) =>
								handleAttachmentsChange("excessHospitalization", files)
							}
						/>
					</div>
				</Card>

				<Card>
					<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-brand">
								Total of A + B + C + D + E
							</p>
							<p className="text-sm text-muted">
								Calculated automatically from the amounts entered above.
							</p>
						</div>

						<output
							className="text-xl font-semibold text-iron-dark"
							htmlFor="numberOfVisits visitFeePerVisit doctorMedicineAmount injectionInvestigationAmount ecgXrayOtherAmount lensCost frameCost healthCheckupAmount excessHospitalizationAmount"
						>
							{currencyFormatter.format(claimedTotal)}
						</output>
					</div>

					{errors.claimedTotal ? (
						<p className="mt-2 text-sm text-rejected" role="alert">
							{errors.claimedTotal}
						</p>
					) : null}
				</Card>
				<hr />
				<FormHeader title="Declaration and Signature" Icon={BadgeIndianRupee} />

				<div className="flex flex-col gap-3">
					<p className="text-sm leading-6 text-iron">
						I confirm that I have kept the Company informed in writing of all
						changes in the status of my dependants covered under the Health
						Scheme. I declare that the information provided in this claim is
						true and complete in every respect.
					</p>

					<Checkbox
						name="declarationAccepted"
						className="shrink-0"
						checked={values.declarationAccepted}
						disabled={isReadOnly || isLoading}
						onChange={(event) =>
							handleChange("declarationAccepted", event?.valueOf() as boolean)
						}
						label="I confirm and accept the declaration above."
					/>

					{errors.declarationAccepted ? (
						<p className="text-sm text-rejected" role="alert">
							{errors.declarationAccepted}
						</p>
					) : null}

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<FormInput
							mode={fieldMode}
							name="employeeSignature"
							label="Signature of Employee"
							value={values.employeeSignature}
							required
							error={errors.employeeSignature}
							helperText="Type your full name as your electronic signature."
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("employeeSignature", event.target.value)
							}
						/>

						<FormInput
							mode={fieldMode}
							type="date"
							name="claimDate"
							label="Date"
							value={values.claimDate}
							required
							error={errors.claimDate}
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("claimDate", event.target.value)
							}
						/>
						<DatePickerInput
							mode="single"
							label="Last Health Check-up Date"
							value={selectedDate}
							disablePast
							onChange={(nextValue) => {
								setSelectedDate(
									nextValue instanceof Date ? nextValue : undefined,
								);
							}}
						/>
					</div>
				</div>

				{approvalStages.length > 0 ? (
					<fieldset className="min-w-0 rounded-md border border-border p-4">
						<legend className="sr-only">Approval Status</legend>
						<ApprovalSection
							stages={approvalStages}
							canApprove={canApprove}
							onAction={onApprovalAction}
						/>
					</fieldset>
				) : null}

				{showOfficeUse ? (
					<fieldset className="min-w-0">
						<legend className="sr-only">For Office Use</legend>
						<FormHeader title="For Office Use" Icon={Building2} />

						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
							<FormInput
								mode={officeFieldMode}
								name="officeReference"
								label="Employee Reference"
								value={values.officeReference}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("officeReference", event.target.value)
								}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeVisitFeesAmount"
								label="A. Visit Fees Passed"
								value={values.officeVisitFeesAmount}
								inputMode="decimal"
								error={errors.officeVisitFeesAmount}
								onChange={amountChange("officeVisitFeesAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeMedicalAmount"
								label="B. Medical Passed"
								value={values.officeMedicalAmount}
								inputMode="decimal"
								error={errors.officeMedicalAmount}
								onChange={amountChange("officeMedicalAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeOphthalmicAmount"
								label="C. Ophthalmic Passed"
								value={values.officeOphthalmicAmount}
								inputMode="decimal"
								error={errors.officeOphthalmicAmount}
								onChange={amountChange("officeOphthalmicAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeHealthCheckupAmount"
								label="D. Health Check-up Passed"
								value={values.officeHealthCheckupAmount}
								inputMode="decimal"
								error={errors.officeHealthCheckupAmount}
								onChange={amountChange("officeHealthCheckupAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="officeExcessHospitalizationAmount"
								label="E. Excess Hospitalisation Passed"
								value={values.officeExcessHospitalizationAmount}
								inputMode="decimal"
								error={errors.officeExcessHospitalizationAmount}
								onChange={amountChange("officeExcessHospitalizationAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								name="passedBy"
								label="Passed By"
								value={values.passedBy}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("passedBy", event.target.value)
								}
							/>

							<FormInput
								mode={officeFieldMode}
								name="passedAmount"
								label="Passed Amount"
								value={values.passedAmount}
								inputMode="decimal"
								error={errors.passedAmount}
								helperText={`Category total: ${currencyFormatter.format(
									officeApprovedTotal,
								)}`}
								onChange={amountChange("passedAmount")}
							/>

							<FormInput
								mode={officeFieldMode}
								type="date"
								name="passedDate"
								label="Passed Date"
								value={values.passedDate}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("passedDate", event.target.value)
								}
							/>
						</div>
					</fieldset>
				) : null}
			</form>
		</Card>
	);
};

export default ReimbursementClaimForm;
