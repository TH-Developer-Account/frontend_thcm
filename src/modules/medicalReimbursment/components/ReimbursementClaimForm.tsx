import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type ReactNode,
} from "react";
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

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";
import FormHeader from "../../../components/ui/FormHeader";
import { ReasonActionModal } from "../../../components/ui/ReasonActionModal";
// import HelperTooltip from "../../../components/common/HelperTooltip";
import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import DatePickerInput from "../../../components/common/DatePickerInput";
import { useToast } from "../../../context/Auth/AuthContext";
import { createClaimHeadRow } from "../helpers/claimHead.helpers";
import {
	deriveClaimStatusLabel,
	sanitizeAmountInput,
	useReimbursementClaimForm,
} from "../hooks/useReimbursementClaimForm";
import type {
	ApprovalStage,
	ClaimHead,
	ClaimHeadFormRow,
	ClaimHeadRow,
	ClaimHeadValidationErrors,
	CoverageType,
	// PatientType,
	ReimbursementClaimActor,
	ReimbursementClaimAttachments,
	ReimbursementClaimFormMode,
	ReimbursementClaimFormValues,
	ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";
import ClaimHeadEntryTable, {
	type ApprovedBillAmountPayload,
} from "./ClaimHeadEntryTable";
import { Badge } from "../../../components/common/Badge";

const GRADE_OPTIONS: Array<{
	label: string;
	value: string;
	eligibility: number;
}> = [
	{ label: "M1", value: "M1", eligibility: 25_000 },
	{ label: "M2", value: "M2", eligibility: 35_000 },
	{ label: "M3", value: "M3", eligibility: 45_000 },
	{ label: "M4", value: "M4", eligibility: 60_000 },
	{ label: "M5", value: "M5", eligibility: 75_000 },
	{ label: "E1", value: "E1", eligibility: 100_000 },
	{ label: "E2", value: "E2", eligibility: 125_000 },
	{ label: "E3", value: "E3", eligibility: 150_000 },
];

const COVERAGE_OPTIONS: Array<{ label: string; value: CoverageType }> = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
	{ label: "Both", value: "BOTH" },
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const toDatePickerValue = (value?: string): Date | undefined => {
	if (!value) return undefined;
	const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

const toDateString = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

interface ReimbursementClaimFormProps {
	mode?: ReimbursementClaimFormMode;
	canEdit?: boolean;
	actorRole?: ReimbursementClaimActor;
	initialLineItems?: ClaimHeadRow[];
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	onBack?: () => void;
	submittedMessage?: string;
	actionText?: string;
	approvalStages?: ApprovalStage[];
	statusLabel?: string;
	canApprove?: boolean;
	canClarify?: boolean;
	isExternalApprover?: boolean;
	commentsSection?: ReactNode;
	workflowSection?: ReactNode;
	approvalActionLoading?: boolean;
	onApproveStage?: () => void | Promise<void>;
	onClarifyStage?: (reason: string) => void | Promise<void>;

	onLineItemApprove?: (
		payload: ApprovedBillAmountPayload,
	) => void | Promise<void>;
}

const ReimbursementClaimForm = ({
	mode = "edit",
	canEdit = true,
	actorRole = "creator",
	initialLineItems = [],
	initialValues,
	initialAttachments,
	onSubmit,
	onSaveDraft,
	onBack,
	submittedMessage,
	actionText = "Submit Claim",
	approvalStages = [],
	statusLabel,
	canApprove = false,
	canClarify = false,
	isExternalApprover = false,
	commentsSection,
	workflowSection,
	approvalActionLoading = false,
	onApproveStage,
	onClarifyStage,
	onLineItemApprove,
}: ReimbursementClaimFormProps) => {
	const { showToast } = useToast();
	const [claimRows, setClaimRows] = useState<ClaimHeadFormRow[]>([
		createClaimHeadRow(),
	]);
	const [savedClaims, setSavedClaims] = useState<ClaimHeadRow[]>(() =>
		initialLineItems.map((item) => ({ ...item })),
	);
	const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
	const [savingClaimId, setSavingClaimId] = useState<string | null>(null);
	const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);
	const [claimErrors, setClaimErrors] = useState<ClaimHeadValidationErrors>({});
	const [clarifyModalOpen, setClarifyModalOpen] = useState(false);
	const [clarifyLoading, setClarifyLoading] = useState(false);

	// ── Line-item review state (demo-only, frontend-local) ────────────────
	// Non-mandatory remarks per line item, keyed by claim id. Only rendered
	// and editable while that item's approvalStatus !== "APPROVED".
	const [lineItemRemarks, setLineItemRemarks] = useState<
		Record<string, string>
	>({});

	const initialLineItemsKey = useMemo(
		() =>
			JSON.stringify(
				initialLineItems.map((item) => ({
					id: item.id,
					claimHead: item.claimHead,
					billNumber: item.billNumber,
					billName: item.billName,
					billDate: item.billDate,
					amount: item.amount,
					fileName: item.fileName,
					approvedClaimAmount: item.approvedClaimAmount,
					approvalStatus: item.approvalStatus,
				})),
			),
		[initialLineItems],
	);
	const syncedLineItemsKey = useRef(initialLineItemsKey);

	useEffect(() => {
		if (syncedLineItemsKey.current === initialLineItemsKey) return;
		syncedLineItemsKey.current = initialLineItemsKey;
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setClaimRows([createClaimHeadRow()]);
		setEditingClaimId(null);
		setClaimErrors({});
		setLineItemRemarks({});
	}, [initialLineItems, initialLineItemsKey]);

	const totalAmountEligible = useMemo(() => {
		const grade = initialValues?.grade ?? "";
		return (
			GRADE_OPTIONS.find((option) => option.value === grade)?.eligibility ?? 0
		);
	}, [initialValues?.grade]);

	const lineItemsTotal = useMemo(
		() =>
			savedClaims.reduce(
				(total, item) => total + (Number(item.amount) || 0),
				0,
			),
		[savedClaims],
	);
	const buildSubmission = useCallback(
		(
			values: ReimbursementClaimFormValues,
			attachments: ReimbursementClaimAttachments,
		): ReimbursementClaimSubmission => {
			const eligibility =
				GRADE_OPTIONS.find((option) => option.value === values.grade)
					?.eligibility ?? 0;

			return {
				values: {
					...values,
					spouseName:
						values.coverageType === "SELF" || !values.coverageType
							? ""
							: values.spouseName,
				},
				attachments,
				lineItems: savedClaims.map((item) => {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { attachment: _attachment, ...rest } = item;
					return {
						...rest,
						fileName: item.file?.name ?? item.fileName ?? null,
					};
				}),
				totalAmountEligible: eligibility,
				lineItemsTotal,
			};
		},
		[lineItemsTotal, savedClaims],
	);

	const submitWithFeedback = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			if (submission.lineItems.length === 0) {
				setClaimErrors((current) => ({
					...current,
					form: "Add at least one claim line item before submitting.",
				}));
				throw new Error("At least one claim line item is required.");
			}

			try {
				await onSubmit?.(submission);
				showToast({
					type: "success",
					title: "Success",
					description: "Medical claim submitted successfully.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description: "Unable to submit the medical claim. Please try again.",
				});
				throw error;
			}
		},
		[onSubmit, showToast],
	);

	const saveDraftWithFeedback = useCallback(
		async (submission: ReimbursementClaimSubmission) => {
			try {
				await onSaveDraft?.(submission);
				showToast({
					type: "success",
					title: "Success",
					description: "Medical claim draft saved successfully.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description:
						"Unable to save the medical claim draft. Please try again.",
				});
				throw error;
			}
		},
		[onSaveDraft, showToast],
	);

	const {
		values,
		errors,
		isLoading,
		isSubmitting,
		isSavingDraft,
		handleChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	} = useReimbursementClaimForm({
		initialValues,
		initialAttachments,
		onSubmit: onSubmit ? submitWithFeedback : undefined,
		onSaveDraft: onSaveDraft ? saveDraftWithFeedback : undefined,
		buildSubmission,
	});

	const selectedGrade = GRADE_OPTIONS.find(
		(option) => option.value === values.grade,
	);
	const resolvedEligibleAmount =
		selectedGrade?.eligibility ?? totalAmountEligible;
	const isReadOnly =
		mode === "view" || !canEdit || actorRole === "externalApprover";
	const canEditClaimForm = !isReadOnly;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";
	const claimStatusLabel =
		statusLabel ?? deriveClaimStatusLabel(approvalStages);

	// Approver may review line items whenever they're in a position to act on
	// this stage — same condition the final Approve button already uses.
	const canReviewLineItems = canApprove;

	const clearClaimError = useCallback((key: string) => {
		setClaimErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, []);

	const handleClaimChange = useCallback(
		(
			rowId: string,
			field: keyof Omit<ClaimHeadFormRow, "id">,
			value: unknown,
		) => {
			setClaimRows((current) =>
				current.map((row) => {
					if (row.id !== rowId) return row;
					if (field === "attachment") {
						const attachment = value as FileUploadValue | null;
						return {
							...row,
							attachment,
							file: attachment?.file ?? null,
							fileName:
								attachment?.file?.name ??
								attachment?.name ??
								row.fileName ??
								null,
						};
					}
					return { ...row, [field]: value };
				}),
			);
			clearClaimError(`${field}-${rowId}`);
		},
		[clearClaimError],
	);

	const validateClaim = useCallback(
		(row: ClaimHeadFormRow): ClaimHeadValidationErrors => {
			const validation: ClaimHeadValidationErrors = {};
			if (!row.claimHead) {
				validation[`claimHead-${row.id}`] = "Claim head is required.";
			}
			if (!row.billNumber.trim()) {
				validation[`billNumber-${row.id}`] = "Bill number is required.";
			}
			if (!row.billName.trim()) {
				validation[`billName-${row.id}`] = "Bill name is required.";
			}

			if (!row.billDate) {
				validation[`billDate-${row.id}`] = "Bill date is required.";
			}
			if (!row.amount || Number(row.amount) <= 0) {
				validation[`amount-${row.id}`] = "Amount is required";
			}
			if (
				!row.attachment?.file &&
				!row.attachment?.url &&
				!row.file &&
				!row.fileName
			) {
				validation[`file-${row.id}`] = "Attachment is required.";
			}
			return validation;
		},
		[],
	);

	const handleSaveClaim = useCallback(
		(row: ClaimHeadFormRow) => {
			const validation = validateClaim(row);
			if (Object.keys(validation).length > 0) {
				setClaimErrors(validation);
				showToast({
					type: "error",
					title: "Complete the claim entry",
					description:
						"Fill all required fields and upload one supporting document before adding the entry.",
				});
				return;
			}

			setSavingClaimId(row.id);
			const savedRow: ClaimHeadRow = {
				...row,
				claimHead: row.claimHead as ClaimHead,
				fileName: row.file?.name ?? row.fileName ?? null,
				approvedClaimAmount: row.approvedClaimAmount || row.amount,
				approvalStatus: row.approvalStatus || "PENDING",
				billDate: row.billDate ?? "",
			};

			setSavedClaims((current) =>
				editingClaimId
					? current.map((item) =>
							item.id === editingClaimId ? savedRow : item,
						)
					: [...current, savedRow],
			);
			setEditingClaimId(null);
			setClaimRows([createClaimHeadRow()]);
			setClaimErrors({});
			setSavingClaimId(null);
		},
		[editingClaimId, showToast, validateClaim],
	);

	const handleEditClaim = useCallback(
		(claim: ClaimHeadRow) => {
			if (!canEditClaimForm) return;
			setEditingClaimId(claim.id);
			setClaimRows([{ ...claim }]);
			setClaimErrors({});
		},
		[canEditClaimForm],
	);

	const handleDeleteClaim = useCallback(
		(id: string) => {
			if (!canEditClaimForm) return;
			setDeletingClaimId(id);
			setSavedClaims((current) => current.filter((claim) => claim.id !== id));
			setEditingClaimId((current) => {
				if (current !== id) return current;
				setClaimRows([createClaimHeadRow()]);
				return null;
			});
			setLineItemRemarks((current) => {
				if (!(id in current)) return current;
				const next = { ...current };
				delete next[id];
				return next;
			});
			setDeletingClaimId(null);
		},
		[canEditClaimForm],
	);

	const handleCancelClaimEdit = useCallback(() => {
		setEditingClaimId(null);
		setClaimErrors({});
		setClaimRows([createClaimHeadRow()]);
	}, []);

	const handleApprovedAmountChange = useCallback(
		(id: string, rawValue: string) => {
			if (!canReviewLineItems) return;
			const approvedClaimAmount = sanitizeAmountInput(rawValue);
			setSavedClaims((current) =>
				current.map((claim) =>
					claim.id === id ? { ...claim, approvedClaimAmount } : claim,
				),
			);
			clearClaimError(`approvedClaimAmount-${id}`);
		},
		[canReviewLineItems, clearClaimError],
	);

	const handleToggleLineItemStatus = useCallback(
		(id: string) => {
			if (!canReviewLineItems) return;
			setSavedClaims((current) =>
				current.map((claim) =>
					claim.id === id
						? {
								...claim,
								approvalStatus:
									claim.approvalStatus === "APPROVED" ? "PENDING" : "APPROVED",
							}
						: claim,
				),
			);
		},
		[canReviewLineItems],
	);

	const handleRemarksChange = useCallback(
		(id: string, value: string) => {
			if (!canReviewLineItems) return;
			setLineItemRemarks((current) => ({ ...current, [id]: value }));
		},
		[canReviewLineItems],
	);

	const buildClarifyReasonPrefix = useCallback((): string => {
		const flagged = savedClaims.filter(
			(item) => item.approvalStatus !== "APPROVED",
		);
		if (flagged.length === 0) return "";

		const lines = flagged.map((item) => {
			const label = item.billNumber
				? `Bill ${item.billNumber}`
				: item.billName || item.claimHead;
			const remark = lineItemRemarks[item.id]?.trim();
			return remark ? `• ${label}: ${remark}` : `• ${label}: Not approved`;
		});

		return `Flagged line items:\n${lines.join("\n")}`;
	}, [lineItemRemarks, savedClaims]);

	const handleClarifyConfirm = async (reason: string) => {
		if (!onClarifyStage) return;
		setClarifyLoading(true);
		try {
			await onClarifyStage(reason);
			setClarifyModalOpen(false);
		} finally {
			setClarifyLoading(false);
		}
	};

	// Final-approve is only enabled once every line item has been marked OK
	// (✓). External approvers have no line items to review, so they're
	// exempt from this gate — same as before.

	const allLineItemsApproved =
		savedClaims.length > 0 &&
		savedClaims.every((item) => item.approvalStatus === "APPROVED");

	const canCompleteStage =
		canApprove && (isExternalApprover || allLineItemsApproved);

	const resetAll = () => {
		handleReset();
		setClaimRows([createClaimHeadRow()]);
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setEditingClaimId(null);
		setClaimErrors({});
		setLineItemRemarks({});
	};
	return (
		<>
			<Card
				title={
					<span className="inline-flex items-center gap-1 text-xl font-semibold tracking-tight text-iron-dark">
						Non-Hospitalisation Claim Form
					</span>
				}
				actions={<Badge status={claimStatusLabel} />}
				footer={
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
						{canEditClaimForm ? (
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
						) : null}
						{canApprove || canClarify ? (
							<div className="flex flex-col gap-2 sm:flex-row">
								{canClarify && onClarifyStage ? (
									<Button
										type="button"
										text="Send for Clarification"
										size="sm"
										appearance="standard"
										variant="outline"
										disabled={approvalActionLoading}
										onClick={() => setClarifyModalOpen(true)}
									/>
								) : null}
								{canApprove && onApproveStage ? (
									<Button
										type="button"
										text={
											isExternalApprover ? "OK and Close" : "Approve and Next"
										}
										size="sm"
										appearance="standard"
										variant="brand"
										isTooltip="Please approve all line items to approve this form"
										disabled={approvalActionLoading || !canCompleteStage}
										onClick={() => void onApproveStage()}
									/>
								) : null}
							</div>
						) : null}
					</div>
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

					<section>
						<FormHeader title="Employee and Patient Details" Icon={UserRound} />
						<div className="grid grid-cols-1 gap-3 px-4.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
							<FormInput
								mode={fieldMode}
								name="ticketNumber"
								label="Ticket Number"
								value={values.ticketNumber}
								error={errors.ticketNumber}
								disabled={Boolean(initialValues?.ticketNumber) || isReadOnly}
								required
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("ticketNumber", event.target.value)
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
								value={
									selectedGrade
										? { label: selectedGrade.label, value: selectedGrade.value }
										: null
								}
								error={errors.grade}
								onChange={(option) =>
									handleChange("grade", option?.value ?? "")
								}
							/>
							<FormInput
								mode="view"
								name="totalAmountEligible"
								label="Total Amount Eligible"
								value={currencyFormatter.format(resolvedEligibleAmount)}
								helperText="Calculated automatically from grade."
							/>
							<FormInput
								mode="view"
								name="companySettledAmount"
								label="Amount Settled This Year"
								value={currencyFormatter.format(
									Number(values.companySettledAmount || 0),
								)}
								helperText="Read-only — pulled from records."
							/>
						</div>
					</section>

					<section>
						<FormHeader title="Coverage Type" Icon={UserRound} />
						<div className="grid grid-cols-1 items-center gap-3 px-4.5 sm:grid-cols-2 xl:grid-cols-4">
							<div className="flex flex-col gap-2">
								<div className="flex flex-wrap gap-4 px-2.5">
									{COVERAGE_OPTIONS.map((option) => (
										<FormInput
											key={option.value}
											id={`coverage-${option.value}`}
											type="radio"
											label={option.label}
											name="coverageType"
											value={option.value}
											checked={values.coverageType === option.value}
											disabled={isReadOnly}
											onChange={() =>
												handleChange("coverageType", option.value)
											}
										/>
									))}
								</div>
								{errors.coverageType ? (
									<p className="text-sm text-rejected">{errors.coverageType}</p>
								) : null}
							</div>
							<FormInput
								mode={fieldMode}
								name="employeeName"
								label="Name of Employee"
								value={values.employeeName}
								disabled
								required
								error={errors.employeeName}
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("employeeName", event.target.value)
								}
							/>
							{values.coverageType === "SPOUSE" ||
							values.coverageType === "BOTH" ? (
								<FormInput
									mode={fieldMode}
									name="spouseName"
									label="Spouse Name"
									value={values.spouseName}
									required
									error={errors.spouseName}
									onChange={(event: ChangeEvent<HTMLInputElement>) =>
										handleChange("spouseName", event.target.value)
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
								onChange={(event: ChangeEvent<HTMLInputElement>) =>
									handleChange("location", event.target.value)
								}
							/>
						</div>
					</section>

					<section>
						<div className="flex items-center justify-between gap-3">
							<FormHeader title="Claim Heads" Icon={Stethoscope} />
							<span className="text-sm font-semibold text-iron-dark">
								Claimed total: {currencyFormatter.format(lineItemsTotal)}
							</span>
						</div>
						{claimErrors.form ? (
							<p className="mb-2 px-4.5 text-sm text-rejected" role="alert">
								{claimErrors.form}
							</p>
						) : null}
						<ClaimHeadEntryTable
							items={claimRows}
							savedItems={savedClaims}
							loading={isLoading}
							editingId={editingClaimId}
							savingId={savingClaimId}
							deletingId={deletingClaimId}
							errors={claimErrors}
							isViewMode={isReadOnly}
							actorRole={actorRole}
							onChange={handleClaimChange}
							onSaveRow={handleSaveClaim}
							onEditRow={handleEditClaim}
							onCancelEdit={handleCancelClaimEdit}
							onDeleteRow={handleDeleteClaim}
							onApprovedAmountChange={handleApprovedAmountChange}
							onToggleLineItemStatus={handleToggleLineItemStatus}
							onApproveLineItem={onLineItemApprove}
							onRemarksChange={handleRemarksChange}
							lineItemRemarks={lineItemRemarks}
							canApproveLineItems={canReviewLineItems}
							canEditClaimRows={canEditClaimForm}
						/>
					</section>

					{mode === "edit" && (
						<section>
							<FormHeader
								title="Declaration and Signature"
								Icon={BadgeIndianRupee}
							/>
							<div className="flex flex-col gap-3 px-4.5">
								<p className="text-sm leading-6 text-iron">
									I confirm that I have kept the Company informed in writing of
									all changes in the status of my dependants covered under the
									Health Scheme. I declare that the information provided in this
									claim is true and complete in every respect.
								</p>
								<Checkbox
									name="declarationAccepted"
									className="shrink-0"
									checked={values.declarationAccepted}
									disabled={isReadOnly || isLoading}
									onChange={(checked) =>
										handleChange("declarationAccepted", checked)
									}
									label="I confirm and accept the declaration above."
								/>
								{errors.declarationAccepted ? (
									<p className="text-sm text-rejected" role="alert">
										{errors.declarationAccepted}
									</p>
								) : null}
								<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 relative">
									<DatePickerInput
										label="Date"
										mode="single"
										value={toDatePickerValue(values.claimDate)}
										onChange={(nextValue) => {
											if (nextValue instanceof Date) {
												handleChange("claimDate", toDateString(nextValue));
											}
										}}
										error={errors.claimDate}
										placeholder="Date"
										disabled={isReadOnly}
										toDate={new Date()}
									/>
								</div>
							</div>
						</section>
					)}

					{commentsSection ? <section>{commentsSection}</section> : null}
					{workflowSection}
				</form>
			</Card>
			<ReasonActionModal
				open={clarifyModalOpen}
				mode="clarify-workflow"
				loading={clarifyLoading}
				defaultReason={buildClarifyReasonPrefix()}
				onClose={() => setClarifyModalOpen(false)}
				onConfirm={handleClarifyConfirm}
			/>
		</>
	);
};

export default ReimbursementClaimForm;
