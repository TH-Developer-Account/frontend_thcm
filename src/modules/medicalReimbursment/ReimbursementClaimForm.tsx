import { useMemo, useState, type ChangeEvent } from "react";
import {
	ArrowLeft,
	BadgeIndianRupee,
	CheckCircle2,
	FilePenLine,
	RefreshCcw,
	Save,
	Stethoscope,
	UserRound,
} from "lucide-react";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormInput from "../../components/forms/FormInput";
import SelectInput from "../../components/forms/SelectInput";
import FormHeader from "../../components/ui/FormHeader";

import ApprovalSection from "./ApprovalSection";
import {
	// sanitizeAmountInput,
	// sanitizeWholeNumberInput,
	useReimbursementClaimForm,
	deriveClaimStatusLabel,
} from "./useReimbursementClaimForm";
import type {
	ApprovalActionType,
	ApprovalStage,
	ClaimHead,
	ClaimHeadFormRow,
	ClaimHeadRow,
	ClaimHeadValidationErrors,
	PatientType,
	ReimbursementClaimAttachments,
	ReimbursementClaimFormMode,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";
import Checkbox from "../../components/forms/Checkbox";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/Auth/AuthContext";
import ClaimHeadEntryTable from "./ClaimHeadEntryTable";
import { createClaimHeadRow } from "./claimHead.helpers";
import { Badge } from "../../components/common/Badge";
import HelperTooltip from "../../components/common/HelperTooltip";

type CoverageType = "SELF" | "SPOUSE" | "BOTH" | "";

// TODO: replace with the real grade → annual eligibility table.
const GRADE_OPTIONS: Array<{
	label: string;
	value: string;
	eligibility: number;
}> = [
	{ label: "M1", value: "M1", eligibility: 25000 },
	{ label: "M2", value: "M2", eligibility: 35000 },
	{ label: "M3", value: "M3", eligibility: 45000 },
	{ label: "M4", value: "M4", eligibility: 60000 },
	{ label: "M5", value: "M5", eligibility: 75000 },
	{ label: "E1", value: "E1", eligibility: 100000 },
	{ label: "E2", value: "E2", eligibility: 125000 },
	{ label: "E3", value: "E3", eligibility: 150000 },
];

const COVERAGE_OPTIONS: Array<{ label: string; value: CoverageType }> = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
	{ label: "Both", value: "BOTH" },
];

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
	const navigate = useNavigate();
	const { showToast } = useToast();

	const [claimRows, setClaimRows] = useState<ClaimHeadFormRow[]>([
		createClaimHeadRow(),
	]);
	const [savedClaims, setSavedClaims] = useState<ClaimHeadRow[]>([]);
	const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
	const [savingClaimId, setSavingClaimId] = useState<string | null>(null);
	const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);
	const [claimErrors, setClaimErrors] = useState<ClaimHeadValidationErrors>({});

	const [ticketNumber, setTicketNumber] = useState("");
	const [grade, setGrade] = useState("");
	const [coverageType, setCoverageType] = useState<CoverageType>("");
	const [spouseName, setSpouseName] = useState("");

	const selectedGrade = GRADE_OPTIONS.find((option) => option.value === grade);
	const totalAmountEligible = selectedGrade?.eligibility ?? 0;

	const lineItemsTotal = useMemo(
		() =>
			savedClaims.reduce(
				(total, item) => total + (Number(item.amount) || 0),
				0,
			),
		[savedClaims],
	);

	const withLineItems = (submission: ReimbursementClaimSubmission) => ({
		...submission,
		ticketNumber,
		grade,
		coverageType,
		spouseName:
			coverageType === "SELF" || coverageType === "" ? "" : spouseName,
		totalAmountEligible,
		lineItems: savedClaims.map((item) => ({
			...item,
			fileName: item.file?.name ?? item.fileName ?? null,
		})),
		lineItemsTotal,
	});

	const submitWithFeedback = async (
		action: "submit" | "draft",
		submission: ReimbursementClaimSubmission,
	) => {
		const payload = withLineItems(submission);
		console.log(`[Medical Claim] ${action} payload`, payload);

		try {
			if (action === "submit") await onSubmit?.(payload);
			else await onSaveDraft?.(payload);

			showToast({
				type: "success",
				title: "Success",
				description:
					action === "submit"
						? "Medical claim submitted successfully."
						: "Medical claim draft saved successfully.",
			});
		} catch (error) {
			console.error(`[Medical Claim] ${action} failed`, error, payload);
			showToast({
				type: "error",
				title: "Error",
				description:
					action === "submit"
						? "Unable to submit the medical claim. Please try again."
						: "Unable to save the medical claim draft. Please try again.",
			});
			throw error;
		}
	};

	const {
		values,
		errors,
		isLoading,
		isSubmitting,
		isSavingDraft,
		mutationError,
		handleChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	} = useReimbursementClaimForm({
		initialValues,
		initialAttachments,
		onSubmit: onSubmit
			? (submission) => submitWithFeedback("submit", submission)
			: undefined,
		onSaveDraft: onSaveDraft
			? (submission) => submitWithFeedback("draft", submission)
			: undefined,
	});

	const isReadOnly = mode === "view" || !canEdit;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";

	// const amountChange =
	// 	(field: keyof ReimbursementClaimFormValues) =>
	// 	(event: ChangeEvent<HTMLInputElement>): void => {
	// 		handleChange(field, sanitizeAmountInput(event.target.value));
	// 	};

	// const hasActions = !isReadOnly && Boolean(onSubmit || onSaveDraft || onBack);
	const claimStatusLabel = deriveClaimStatusLabel(approvalStages);

	const handleBackToView = () => {
		navigate("/medical-claim/form/view", {
			replace: true,
		});
	};

	const handleClaimChange = (
		rowId: string,
		field: keyof Omit<ClaimHeadFormRow, "id">,
		value: unknown,
	) => {
		setClaimRows((current) =>
			current.map((row) =>
				row.id === rowId
					? {
							...row,
							[field]: value,
						}
					: row,
			),
		);

		// Clear validation for the field just edited
		setClaimErrors((current) => {
			const next = { ...current };
			delete next[`${field}-${rowId}`];
			return next;
		});
	};

	const validateClaim = (row: ClaimHeadFormRow): ClaimHeadValidationErrors => {
		const validation: ClaimHeadValidationErrors = {};

		if (!row.claimHead)
			validation[`claimHead-${row.id}`] = "Claim head is required.";

		if (!row.billNumber.trim())
			validation[`billNumber-${row.id}`] = "Bill number is required.";

		if (!row.billName.trim())
			validation[`billName-${row.id}`] = "Bill name is required.";

		// if (!row.patient) validation[`patient-${row.id}`] = "Select patient.";

		if (!row.billDate)
			validation[`billDate-${row.id}`] = "Bill date is required.";

		if (!row.amount) validation[`amount-${row.id}`] = "Amount is required.";

		if (!row.file) validation[`file-${row.id}`] = "Attachment is required.";

		return validation;
	};

	const handleSaveClaim = (row: ClaimHeadFormRow) => {
		console.log("Saving row:", row);

		const validation = validateClaim(row);

		console.log("Validation:", validation);

		if (Object.keys(validation).length > 0) {
			setClaimErrors(validation);
			return;
		}

		setSavingClaimId(row.id);

		const savedRow: ClaimHeadRow = {
			...row,
			claimHead: row.claimHead as ClaimHead,
			patient: row.patient as PatientType,
			fileName: row.file?.name,
		};

		if (editingClaimId) {
			setSavedClaims((current) =>
				current.map((claim) =>
					claim.id === editingClaimId ? savedRow : claim,
				),
			);
			setEditingClaimId(null);
		} else {
			setSavedClaims((current) => [...current, savedRow]);
		}

		setClaimRows([createClaimHeadRow()]);
		setClaimErrors({});
		setSavingClaimId(null);
	};

	const handleEditClaim = (claim: ClaimHeadRow) => {
		setEditingClaimId(claim.id);
		setClaimRows([{ ...claim }]);
	};

	const handleDeleteClaim = (id: string) => {
		setDeletingClaimId(id);

		setSavedClaims((current) => current.filter((claim) => claim.id !== id));

		if (editingClaimId === id) {
			setEditingClaimId(null);
			setClaimRows([createClaimHeadRow()]);
		}

		setDeletingClaimId(null);
	};

	const handleCancelClaimEdit = () => {
		setEditingClaimId(null);
		setClaimErrors({});
		setClaimRows([createClaimHeadRow()]);
	};

	const handleApprovalWithFeedback = async (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => {
		const payload = { stageId, action, comment };
		console.log("[Medical Claim] approval action payload", payload);

		try {
			await onApprovalAction?.(stageId, action, comment);
			showToast({
				type: "success",
				title: "Success",
				description: "Approval action completed successfully.",
			});
		} catch (error) {
			console.error("[Medical Claim] approval action failed", error, payload);
			showToast({
				type: "error",
				title: "Error",
				description:
					"Unable to complete the approval action. Please try again.",
			});
			throw error;
		}
	};

	const resetAll = () => {
		handleReset();
		setClaimRows([createClaimHeadRow()]);
		setSavedClaims([]);
		setEditingClaimId(null);
		setClaimErrors({});
		setTicketNumber("");
		setGrade("");
		setCoverageType("");
		setSpouseName("");
	};

	return (
		<Card
			title={
				<>
					<div>
						<h1 className="mt-1 text-xl font-semibold tracking-tight text-iron-dark">
							Non-Hospitalisation Claim Form
							<HelperTooltip
								label="i"
								text="Complete the employee and treatment details below, and attach
							supporting documents against each claim head. Fields marked
							required must be completed before submission."
							/>
						</h1>
					</div>
				</>
			}
			actions={
				<>
					<Button
						onClick={handleBackToView}
						text="View Form"
						size="sm"
						appearance="standard"
						variant="outline"
					/>
					<Badge status={"Approved"} />
				</>
			}
			footer={
				// hasActions ? (
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
							onClick={resetAll}
						/>

						{/* {onSaveDraft ? ( */}
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
						{/* ) : null} */}

						{/* {onSubmit ? ( */}
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
						{/* ) : null} */}
					</div>
				</div>
				// ) : null
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
				<div>
					<FormHeader title="Employee and Patient Details" Icon={UserRound} />
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4 px-4.5">
						<FormInput
							mode={fieldMode}
							name="ticketNumber"
							label="Ticket Number"
							value={values.ticketNumber}
							error={errors.ticketNumber}
							disabled
							required
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								setTicketNumber(event.target.value)
							}
						/>

						<SelectInput
							mode={fieldMode}
							name="grade"
							label="Grade"
							placeholder="Select grade"
							options={GRADE_OPTIONS.map(({ label, value }) => ({
								label,
								value,
							}))}
							isDisabled
							value={
								GRADE_OPTIONS.find((option) => option.value === grade)
									? { label: grade, value: grade }
									: null
							}
							onChange={(option) => setGrade((option?.value as string) ?? "")}
						/>
						<FormInput
							mode="view"
							name="totalAmountEligible"
							label="Total Amount Eligible"
							value={currencyFormatter.format(totalAmountEligible)}
							helperText="Calculated automatically from grade."
						/>
						<FormInput
							mode="view"
							name="companySettledAmount"
							label="Amount Already Settled This Calendar Year"
							value={currencyFormatter.format(
								Number(values.companySettledAmount || 0),
							)}
							helperText="Read-only — pulled from records."
						/>
					</div>
				</div>

				<div>
					<FormHeader title="Coverage Type" Icon={UserRound} />
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 px-4.5 items-center">
						<div className="flex flex-col gap-2">
							<div className="flex flex-wrap gap-4 px-2.5">
								{COVERAGE_OPTIONS.map((option) => (
									<FormInput
										type="radio"
										label={option.label}
										name="coverageType"
										value={option.value}
										checked={coverageType === option.value}
										disabled={isReadOnly}
										onChange={() => setCoverageType(option.value)}
									/>
								))}
							</div>
						</div>
						<FormInput
							mode={fieldMode}
							name="employeeName"
							label="Name of Employee"
							value={values.employeeName}
							required
							disabled
							error={errors.employeeName}
							autoComplete="name"
							onChange={(event: ChangeEvent<HTMLInputElement>) =>
								handleChange("employeeName", event.target.value)
							}
						/>
						{coverageType === "SPOUSE" || coverageType === "BOTH" ? (
							<FormInput
								mode={fieldMode}
								name="spouseName"
								label="Spouse Name"
								value={spouseName}
								required
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									setSpouseName(event.target.value)
								}
							/>
						) : null}
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
					</div>
				</div>
				<div>
					<FormHeader title="Claim Heads" Icon={Stethoscope} />
					<ClaimHeadEntryTable
						items={claimRows}
						savedItems={savedClaims}
						loading={false}
						editingId={editingClaimId}
						savingId={savingClaimId}
						deletingId={deletingClaimId}
						errors={claimErrors}
						isViewMode={isReadOnly}
						onChange={handleClaimChange}
						onSaveRow={handleSaveClaim}
						onEditRow={handleEditClaim}
						onCancelEdit={handleCancelClaimEdit}
						onDeleteRow={handleDeleteClaim}
					/>
				</div>

				<div>
					<FormHeader
						title="Declaration and Signature"
						Icon={BadgeIndianRupee}
					/>
					<div className="flex flex-col gap-3 px-4.5">
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

						<div className="flex justify-end items-end text-right w-[50%]">
							{/* <FormInput
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
						/> */}

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
						</div>
					</div>
				</div>
				{approvalStages.length > 0 ? (
					<fieldset className="min-w-0 rounded-md border border-border p-4">
						<legend className="sr-only">Approval Status</legend>
						<ApprovalSection
							stages={approvalStages}
							canApprove={canApprove}
							onAction={
								onApprovalAction ? handleApprovalWithFeedback : undefined
							}
						/>
					</fieldset>
				) : null}
			</form>
		</Card>
	);
};

export default ReimbursementClaimForm;
