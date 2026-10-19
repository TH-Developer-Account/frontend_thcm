import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { createClaimHeadRow } from "../helpers/reimbursementClaimForm.helper";
import {
	approvalReasonSchema,
	clarificationReasonSchema,
	createClaimHeadRowSchema,
	createReimbursementClaimSubmitSchema,
	deriveEligibility,
	firstErrorMessage,
	lineItemApprovalSchema,
	lineItemRemarksSchema,
	reimbursementClaimDraftSchema,
	toFieldErrors,
	toRowErrors,
} from "../utils/reimbursementClaim.schemas";
import { FALLBACK_GRADE_OPTIONS } from "../utils/gradeEligibility.constants";
import {
	EMPTY_CLAIM_ATTACHMENTS,
	type ApprovalStage,
	type ClaimHead,
	type ClaimHeadFormRow,
	type ClaimHeadRow,
	type ClaimHeadValidationErrors,
	type CoverageType,
	type GradeOption,
	type ReimbursementClaimActor,
	type ReimbursementClaimAttachments,
	type ReimbursementClaimFormErrors,
	type ReimbursementClaimFormMode,
	type ReimbursementClaimFormValues,
	type ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";
import { getEligibilityPeriodLabel } from "../utils/mediclaimBackend.config";

/** @deprecated use gradeOptions from useGradeOptions — kept for old imports. */
export const GRADE_OPTIONS = FALLBACK_GRADE_OPTIONS;

export const COVERAGE_OPTIONS: Array<{ label: string; value: CoverageType }> = [
	{ label: "Self", value: "SELF" },
	{ label: "Spouse", value: "SPOUSE" },
	{ label: "Both", value: "BOTH" },
];

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

export const EMPTY_REIMBURSEMENT_CLAIM_VALUES: ReimbursementClaimFormValues = {
	location: "",
	employeeName: "",
	ticketNumber: "",
	grade: "",
	coverageType: "",
	spouseName: "",
	companySettledAmount: "",
	declarationAccepted: false,
	claimDate: "",
	medicalAdvanceAmount: "",
	employeeSignature: "",
};

export type ApprovedBillAmountPayload = ClaimHeadRow;

export type ReasonAction = "approve" | "clarify";

export interface UseReimbursementClaimFormArgs {
	referenceNumber?: string;
	mode?: ReimbursementClaimFormMode;
	canEdit?: boolean;
	actorRole?: ReimbursementClaimActor;
	initialLineItems?: ClaimHeadRow[];
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	/** Grade → cap options (useGradeOptions). Falls back to the static list. */
	gradeOptions?: GradeOption[];
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	onBack?: () => void;
	submittedMessage?: string;
	/** Toast text after a successful onSubmit. */
	submitSuccessMessage?: string;
	actionText?: string;
	approvalStages?: ApprovalStage[];
	statusLabel?: string;
	canApprove?: boolean;
	canClarify?: boolean;
	/**
	 * Whether the Approved Amount / Approved / Remarks columns are editable.
	 * Pass `permissions.canReviewLineItems`. Defaults to `canApprove`.
	 */
	canReviewLineItems?: boolean;
	/** Hide the review columns entirely (claimant filling a fresh claim). */
	hideReviewColumns?: boolean;
	isExternalApprover?: boolean;
	commentsSection?: ReactNode;
	auditSection?: ReactNode;
	workflowSection?: ReactNode;
	approvalActionLoading?: boolean;
	onApproveStage?: (reason: string) => void | Promise<void>;
	onClarifyStage?: (reason: string) => void | Promise<void>;
	onLineItemApprove?: (
		payload: ApprovedBillAmountPayload,
	) => void | Promise<void>;
	onLineItemUnapprove?: (
		payload: ApprovedBillAmountPayload,
	) => void | Promise<void>;
	onLineItemRemarksSave?: (
		payload: ApprovedBillAmountPayload,
	) => void | Promise<void>;
	/** Claim-level close (initiator / external approver once APPROVED). */
	canClose?: boolean;
	onCloseClaim?: () => void | Promise<void>;
	isClosing?: boolean;
	/** Clarification reason shown to the claimant. */
	correctionReason?: string | null;
	/**
	 * Amount submitted / under review in OTHER claims this year, not yet
	 * settled. THCM pages only; undefined hides the "THCM only" block.
	 */
	eligibilityPendingAmount?: number;
	/** Label for the eligibility year, e.g. "FY 2026-27". */
	eligibilityPeriodLabel?: string;
	/** true → submit is blocked when the claimed total exceeds the balance. */
	enforceEligibilityLimit?: boolean;
}

export function deriveClaimStatusLabel(stages: ApprovalStage[]): string {
	if (!stages.length) return "Draft";
	if (stages.some((stage) => stage.status === "rejected")) return "Rejected";
	if (stages.every((stage) => stage.status === "approved")) return "Approved";
	if (stages.some((stage) => stage.status === "clarification_requested")) {
		return "Clarification Requested";
	}
	return "Pending Approval";
}

export function sanitizeAmountInput(raw: string): string {
	const cleaned = raw.replace(/[^0-9.]/g, "");
	const firstDot = cleaned.indexOf(".");
	if (firstDot === -1) return cleaned.slice(0, 9);
	const whole = cleaned.slice(0, firstDot).slice(0, 9);
	const fraction = cleaned
		.slice(firstDot + 1)
		.replace(/\./g, "")
		.slice(0, 2);
	return `${whole}.${fraction}`;
}

export function sanitizeWholeNumberInput(raw: string, maxLength = 50): string {
	return raw.replace(/[^0-9]/g, "").slice(0, maxLength);
}

/** Bill number as typed → CAPS letters, digits, "-" and "/" only. */
export function sanitizeBillNumberInput(raw: string, maxLength = 50): string {
	return raw
		.toUpperCase()
		.replace(/[^A-Z0-9/-]/g, "")
		.slice(0, maxLength);
}

export const toDatePickerValue = (value?: string): Date | undefined => {
	if (!value) return undefined;
	const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

export const toDateString = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * The amount an approval should use: what the approver typed, otherwise the
 * claimed amount. Never "" → 0 (that approved bills at ₹0).
 */
export const resolveApprovedAmount = (
	row: Pick<ClaimHeadRow, "approvedClaimAmount" | "amount">,
): string => {
	const typed = row.approvedClaimAmount?.toString().trim();
	return typed ? typed : String(row.amount ?? "").trim();
};

/** Declaration date defaults to today while the claimant can edit it. */
const withDeclarationDateDefault = (
	values: ReimbursementClaimFormValues,
	shouldAutofill: boolean,
): ReimbursementClaimFormValues =>
	shouldAutofill && !values.claimDate
		? { ...values, claimDate: toDateString(new Date()) }
		: values;

/**
 * Server rows win, except review input still being typed: on a row the
 * server hasn't approved, a non-empty local approved amount / remark is kept.
 */
export const mergeReviewedLineItems = (
	local: ClaimHeadRow[],
	server: ClaimHeadRow[],
): ClaimHeadRow[] => {
	const localById = new Map(local.map((item) => [item.id, item]));
	return server.map((row) => {
		const mine = localById.get(row.id);
		if (!mine || row.approvalStatus === "APPROVED") return { ...row };
		const typedAmount = mine.approvedClaimAmount?.toString().trim();
		const typedRemarks = mine.remarks?.trim();
		return {
			...row,
			approvedClaimAmount: typedAmount
				? mine.approvedClaimAmount
				: row.approvedClaimAmount,
			remarks: typedRemarks ? mine.remarks : row.remarks,
		};
	});
};

const getLineItemsKey = (items: ClaimHeadRow[]): string =>
	JSON.stringify(
		items.map((item) => ({
			id: item.id,
			claimHead: item.claimHead,
			billNumber: item.billNumber,
			billName: item.billName,
			billDate: item.billDate,
			amount: item.amount,
			fileName: item.fileName,
			attachmentId: item.attachment?.id,
			attachmentName: item.attachment?.name,
			attachmentUrl: item.attachment?.url,
			approvedClaimAmount: item.approvedClaimAmount,
			approvalStatus: item.approvalStatus,
			remarks: item.remarks,
		})),
	);

const errorMessage = (error: unknown, fallback: string) =>
	getApiErrorMessage(
		error,
		error instanceof Error && error.message ? error.message : fallback,
	);

export function useReimbursementClaimForm({
	mode = "edit",
	canEdit = true,
	actorRole = "creator",
	initialLineItems = [],
	initialValues,
	initialAttachments,
	gradeOptions: gradeOptionsProp,
	onSubmit,
	onSaveDraft,
	onBack,
	submittedMessage,
	submitSuccessMessage = "Medical claim submitted successfully.",
	actionText = "Submit Claim",
	approvalStages = [],
	statusLabel,
	canApprove = false,
	canClarify = false,
	canReviewLineItems: canReviewLineItemsProp,
	hideReviewColumns = false,
	isExternalApprover = false,
	commentsSection,
	auditSection,
	workflowSection,
	approvalActionLoading = false,
	onApproveStage,
	onClarifyStage,
	onLineItemApprove,
	onLineItemUnapprove,
	referenceNumber,
	onLineItemRemarksSave,
	canClose = false,
	onCloseClaim,
	isClosing = false,
	correctionReason,
	eligibilityPendingAmount,
	eligibilityPeriodLabel,
	enforceEligibilityLimit = true,
}: UseReimbursementClaimFormArgs) {
	const { showToast } = useToast();

	const isReadOnly =
		mode === "view" || !canEdit || actorRole === "externalApprover";
	const shouldAutofillDeclarationDate = !isReadOnly;

	const gradeOptions = gradeOptionsProp?.length
		? gradeOptionsProp
		: FALLBACK_GRADE_OPTIONS;

	const [values, setValues] = useState<ReimbursementClaimFormValues>(() =>
		withDeclarationDateDefault(
			{ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues },
			shouldAutofillDeclarationDate,
		),
	);
	const [attachments, setAttachments] = useState<ReimbursementClaimAttachments>(
		{
			...EMPTY_CLAIM_ATTACHMENTS,
			...initialAttachments,
		},
	);
	const [errors, setErrors] = useState<ReimbursementClaimFormErrors>({});
	const [claimRows, setClaimRows] = useState<ClaimHeadFormRow[]>([
		createClaimHeadRow(),
	]);
	const [savedClaims, setSavedClaims] = useState<ClaimHeadRow[]>(() =>
		initialLineItems.map((item) => ({ ...item })),
	);
	const [claimErrors, setClaimErrors] = useState<ClaimHeadValidationErrors>({});
	const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
	const [savingClaimId, setSavingClaimId] = useState<string | null>(null);
	const [deletingClaimId, setDeletingClaimId] = useState<string | null>(null);
	const [approvingClaimId, setApprovingClaimId] = useState<string | null>(null);
	const [savingRemarksId, setSavingRemarksId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [mutationError, setMutationError] = useState<string | null>(null);
	const [clarifyModalOpen, setClarifyModalOpen] = useState(false);
	const [clarifyLoading, setClarifyLoading] = useState(false);

	const initialValuesKey = useMemo(
		() => JSON.stringify(initialValues ?? {}),
		[initialValues],
	);
	const initialAttachmentsKey = useMemo(
		() =>
			JSON.stringify(
				Object.entries(initialAttachments ?? {}).map(([head, files]) => [
					head,
					files?.map((file) => [file.id, file.name, file.url]),
				]),
			),
		[initialAttachments],
	);
	const initialLineItemsKey = useMemo(
		() => getLineItemsKey(initialLineItems),
		[initialLineItems],
	);
	const syncedValuesKey = useRef(initialValuesKey);
	const syncedAttachmentsKey = useRef(initialAttachmentsKey);
	const syncedLineItemsKey = useRef(initialLineItemsKey);

	useEffect(() => {
		if (syncedValuesKey.current === initialValuesKey) return;
		syncedValuesKey.current = initialValuesKey;
		setValues(
			withDeclarationDateDefault(
				{ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues },
				shouldAutofillDeclarationDate,
			),
		);
		setErrors({});
		setMutationError(null);
	}, [initialValues, initialValuesKey, shouldAutofillDeclarationDate]);

	useEffect(() => {
		if (syncedAttachmentsKey.current === initialAttachmentsKey) return;
		syncedAttachmentsKey.current = initialAttachmentsKey;
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
	}, [initialAttachments, initialAttachmentsKey]);

	useEffect(() => {
		if (syncedLineItemsKey.current === initialLineItemsKey) return;
		syncedLineItemsKey.current = initialLineItemsKey;
		if (canReviewLineItemsProp ?? canApprove) {
			// Reviewer refetch after a line-item action: take the server's
			// rows, but keep amounts/remarks still being typed on rows the
			// server hasn't approved yet.
			setSavedClaims((current) =>
				mergeReviewedLineItems(current, initialLineItems),
			);
			return;
		}
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setClaimRows([createClaimHeadRow()]);
		setEditingClaimId(null);
		setClaimErrors({});
	}, [
		canApprove,
		canReviewLineItemsProp,
		initialLineItems,
		initialLineItemsKey,
	]);

	const selectedGrade = useMemo(
		() => gradeOptions.find((option) => option.value === values.grade),
		[gradeOptions, values.grade],
	);
	/** null when the grade has no known cap — panel + limit check adapt. */
	const resolvedEligibleAmount: number | null =
		selectedGrade?.eligibility ?? null;
	const lineItemsTotal = useMemo(
		() =>
			Math.round(
				savedClaims.reduce(
					(total, item) => total + (Number(item.amount) || 0),
					0,
				) * 100,
			) / 100,
		[savedClaims],
	);

	// ---- Eligibility (drives the side panel; same numbers for guest + THCM) ----
	const settledAmount = Number(values.companySettledAmount) || 0;
	const eligibility = useMemo(
		() =>
			deriveEligibility(
				{ totalEligible: resolvedEligibleAmount ?? 0, settled: settledAmount },
				lineItemsTotal,
			),
		[lineItemsTotal, resolvedEligibleAmount, settledAmount],
	);
	const resolvedEligibilityPeriodLabel =
		eligibilityPeriodLabel ?? getEligibilityPeriodLabel();

	const allowedGrades = useMemo(
		() => gradeOptions.map((option) => option.value),
		[gradeOptions],
	);

	const submitSchema = useMemo(
		() =>
			createReimbursementClaimSubmitSchema({
				allowedGrades,
				remainingAmount: eligibility.remaining,
				// Without a known cap we can't know the limit, so don't block.
				enforceRemaining:
					enforceEligibilityLimit && resolvedEligibleAmount !== null,
			}),
		[
			allowedGrades,
			eligibility.remaining,
			enforceEligibilityLimit,
			resolvedEligibleAmount,
		],
	);
	const rowSchema = useMemo(() => createClaimHeadRowSchema(), []);

	const canEditClaimForm = !isReadOnly;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";
	const claimStatusLabel =
		statusLabel ?? deriveClaimStatusLabel(approvalStages);
	const canReviewLineItems = canReviewLineItemsProp ?? canApprove;
	const isLineItemReviewLocked = !canReviewLineItems;
	const isLoading = isSubmitting || isSavingDraft;

	const clearClaimError = useCallback((key: string) => {
		setClaimErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, []);

	// Grade comes from HR records (User.grade / legacy data) at initiation.
	// When it's on record, the claimant can't change it — the backend trusts
	// the submitted grade for the eligibility cap. Only an empty grade is
	// selectable, so a claim without one can still be submitted.
	const isGradeLocked = Boolean(initialValues?.grade?.trim());

	const handleChange = useCallback(
		<K extends keyof ReimbursementClaimFormValues>(
			field: K,
			value: ReimbursementClaimFormValues[K],
		) => {
			if (field === "grade" && isGradeLocked) return;
			setValues((current) => {
				const next = { ...current, [field]: value };
				// Self-only cover never keeps a stale spouse name.
				if (field === "coverageType" && value === "SELF") next.spouseName = "";
				return next;
			});
			setErrors((current) => {
				if (!current[field]) return current;
				const next = { ...current };
				delete next[field];
				return next;
			});
		},
		[isGradeLocked],
	);

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
							fileName: attachment?.file?.name ?? attachment?.name ?? null,
						};
					}
					return { ...row, [field]: value };
				}),
			);
			clearClaimError(`${field === "attachment" ? "file" : field}-${rowId}`);
			clearClaimError("form");
		},
		[clearClaimError],
	);

	// Bill-row validation now lives in createClaimHeadRowSchema.
	const validateClaim = useCallback(
		(row: ClaimHeadFormRow): ClaimHeadValidationErrors => {
			const result = rowSchema.safeParse(row);
			const rowErrors: ClaimHeadValidationErrors = result.success
				? {}
				: toRowErrors(row.id, result.error);

			// Same bill number twice under the same head is almost always a
			// double entry — catch it when the row is added, not at submit.
			const duplicate = savedClaims.find(
				(item) =>
					item.id !== row.id &&
					item.claimHead === row.claimHead &&
					item.billNumber.trim().toUpperCase() ===
						row.billNumber.trim().toUpperCase() &&
					row.billNumber.trim() !== "",
			);
			if (duplicate && !rowErrors[`billNumber-${row.id}`]) {
				rowErrors[`billNumber-${row.id}`] =
					"This bill number is already added under the same claim head.";
			}
			return rowErrors;
		},
		[rowSchema, savedClaims],
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
						Object.values(validation)[0] ??
						"Fill all required fields and upload one supporting document before adding the entry.",
				});
				return;
			}
			setSavingClaimId(row.id);
			const savedRow: ClaimHeadRow = {
				...row,
				claimHead: row.claimHead as ClaimHead,
				billNumber: row.billNumber.trim(),
				billName: row.billName.trim(),
				amount: String(Number(row.amount)),
				fileName:
					row.file?.name ?? row.attachment?.name ?? row.fileName ?? null,
				approvedClaimAmount: row.approvedClaimAmount ?? "",
				approvalStatus: row.approvalStatus || "PENDING",
				remarks: row.remarks ?? "",
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
			clearClaimError(`remarks-${id}`);
		},
		[canReviewLineItems, clearClaimError],
	);

	const setRowReviewState = useCallback(
		(id: string, patch: Partial<ClaimHeadRow>) => {
			setSavedClaims((current) =>
				current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
			);
		},
		[],
	);

	/** Un-approves a bill (backend call when wired, local toggle otherwise). */
	const handleToggleLineItemStatus = useCallback(
		async (id: string) => {
			if (!canReviewLineItems) return;
			const claim = savedClaims.find((item) => item.id === id);
			if (!claim) return;

			if (claim.approvalStatus !== "APPROVED" || !onLineItemUnapprove) {
				setRowReviewState(id, {
					approvalStatus:
						claim.approvalStatus === "APPROVED" ? "PENDING" : "APPROVED",
				});
				return;
			}

			setApprovingClaimId(id);
			try {
				await onLineItemUnapprove(claim);
				setRowReviewState(id, { approvalStatus: "PENDING", approved: false });
				showToast({
					type: "success",
					title: "Approval removed",
					description: "The bill is back to pending review.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to update the bill",
					description: errorMessage(
						error,
						"Unable to remove the approval. Please try again.",
					),
				});
			} finally {
				setApprovingClaimId(null);
			}
		},
		[
			canReviewLineItems,
			onLineItemUnapprove,
			savedClaims,
			setRowReviewState,
			showToast,
		],
	);

	const handleApproveLineItem = useCallback(
		async (claim: ClaimHeadRow) => {
			if (!canReviewLineItems) return;

			const approvedClaimAmount = resolveApprovedAmount(claim);
			const validation = lineItemApprovalSchema.safeParse({
				amount: String(claim.amount),
				approvedClaimAmount,
				remarks: claim.remarks ?? "",
			});
			if (!validation.success) {
				const fieldErrors = toRowErrors(claim.id, validation.error);
				setClaimErrors((current) => ({ ...current, ...fieldErrors }));
				showToast({
					type: "error",
					title: "Check the approved amount",
					description: firstErrorMessage(validation.error),
				});
				return;
			}

			if (!onLineItemApprove) {
				setRowReviewState(claim.id, {
					approvalStatus: "APPROVED",
					approvedClaimAmount,
				});
				return;
			}

			setApprovingClaimId(claim.id);
			try {
				await onLineItemApprove({ ...claim, approvedClaimAmount });
				setRowReviewState(claim.id, {
					approvalStatus: "APPROVED",
					approved: true,
					approvedClaimAmount,
				});
				clearClaimError(`approvedClaimAmount-${claim.id}`);
				clearClaimError(`remarks-${claim.id}`);
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to approve the bill",
					description: errorMessage(
						error,
						"Unable to approve this line item. Please try again.",
					),
				});
			} finally {
				setApprovingClaimId(null);
			}
		},
		[
			canReviewLineItems,
			clearClaimError,
			onLineItemApprove,
			setRowReviewState,
			showToast,
		],
	);

	const handleRemarksChange = useCallback(
		(id: string, value: string) => {
			if (!canReviewLineItems) return;
			setSavedClaims((current) =>
				current.map((claim) =>
					claim.id === id ? { ...claim, remarks: value } : claim,
				),
			);
			clearClaimError(`remarks-${id}`);
		},
		[canReviewLineItems, clearClaimError],
	);

	const handleSaveRemarks = useCallback(
		async (claimId: string) => {
			if (!canReviewLineItems || !onLineItemRemarksSave) return;

			const claim = savedClaims.find((item) => item.id === claimId);
			if (!claim || claim.approvalStatus === "APPROVED") return;

			const validation = lineItemRemarksSchema.safeParse({
				remarks: claim.remarks ?? "",
			});
			if (!validation.success) {
				setClaimErrors((current) => ({
					...current,
					[`remarks-${claimId}`]: firstErrorMessage(validation.error),
				}));
				return;
			}

			const trimmedRemarks = validation.data.remarks;
			clearClaimError(`remarks-${claimId}`);
			setSavingRemarksId(claimId);

			try {
				await onLineItemRemarksSave({ ...claim, remarks: trimmedRemarks });
				setRowReviewState(claimId, { remarks: trimmedRemarks });
				showToast({
					type: "success",
					title: "Remarks saved",
					description: "The bill remarks have been updated.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to save remarks",
					description: errorMessage(
						error,
						"Unable to save remarks. Please try again.",
					),
				});
			} finally {
				setSavingRemarksId(null);
			}
		},
		[
			canReviewLineItems,
			clearClaimError,
			onLineItemRemarksSave,
			savedClaims,
			setRowReviewState,
			showToast,
		],
	);

	const buildSubmission = useCallback(
		(): ReimbursementClaimSubmission => ({
			values: {
				...values,
				location: values.location.trim(),
				spouseName:
					values.coverageType === "SELF" || !values.coverageType
						? ""
						: values.spouseName.trim(),
			},
			attachments,
			lineItems: savedClaims.map((item) => ({
				...item,
				fileName:
					item.file?.name ?? item.attachment?.name ?? item.fileName ?? null,
			})),
			totalAmountEligible: resolvedEligibleAmount ?? 0,
			lineItemsTotal,
		}),
		[attachments, lineItemsTotal, resolvedEligibleAmount, savedClaims, values],
	);

	/** True when a bill row is half-filled but not added to the table yet. */
	const hasUnsavedRow = useMemo(
		() =>
			claimRows.some(
				(row) =>
					Boolean(row.claimHead) ||
					Boolean(row.billNumber.trim()) ||
					Boolean(row.billName.trim()) ||
					Boolean(row.amount) ||
					Boolean(row.file),
			),
		[claimRows],
	);

	const handleSubmit = useCallback(async () => {
		if (isSubmitting) return;

		const result = submitSchema.safeParse({ values, lineItems: savedClaims });
		if (!result.success) {
			const { form: schemaForm, ...fieldErrors } = toFieldErrors(result.error);
			const form =
				hasUnsavedRow && savedClaims.length === 0
					? "You entered a bill but didn't add it — click + to add it to the claim."
					: schemaForm;
			setErrors(fieldErrors as ReimbursementClaimFormErrors);
			setClaimErrors((current) => {
				const next = { ...current };
				if (form) next.form = form;
				else delete next.form;
				return next;
			});
			showToast({
				type: "error",
				title: "Please fix the highlighted fields",
				description: form ?? firstErrorMessage(result.error),
			});
			return;
		}
		if (editingClaimId) {
			showToast({
				type: "error",
				title: "Finish editing the bill",
				description:
					"Save or cancel the bill you are editing before submitting.",
			});
			return;
		}

		setErrors({});
		clearClaimError("form");
		setMutationError(null);
		setIsSubmitting(true);
		try {
			await onSubmit?.(buildSubmission());
			showToast({
				type: "success",
				title: "Success",
				description: submitSuccessMessage,
			});
		} catch (error) {
			const message = errorMessage(
				error,
				"Unable to submit the medical claim. Please try again.",
			);
			setMutationError(message);
			showToast({
				type: "error",
				title: "Submission failed",
				description: message,
			});
		} finally {
			setIsSubmitting(false);
		}
	}, [
		buildSubmission,
		clearClaimError,
		editingClaimId,
		hasUnsavedRow,
		isSubmitting,
		onSubmit,
		savedClaims,
		showToast,
		submitSchema,
		submitSuccessMessage,
		values,
	]);

	const handleSaveDraft = useCallback(async () => {
		if (isSavingDraft) return;
		const result = reimbursementClaimDraftSchema.safeParse(values);
		if (!result.success) {
			setErrors(toFieldErrors(result.error) as ReimbursementClaimFormErrors);
			showToast({
				type: "error",
				title: "Draft not saved",
				description: firstErrorMessage(result.error),
			});
			return;
		}
		setErrors({});
		setMutationError(null);
		setIsSavingDraft(true);

		try {
			await onSaveDraft?.(buildSubmission());
			showToast({
				type: "success",
				title: "Draft saved",
				description: "You can come back to this link and continue later.",
			});
		} catch (error) {
			const message = errorMessage(
				error,
				"Unable to save the medical claim draft. Please try again.",
			);
			setMutationError(message);
			showToast({
				type: "error",
				title: "Draft not saved",
				description: message,
			});
		} finally {
			setIsSavingDraft(false);
		}
	}, [buildSubmission, isSavingDraft, onSaveDraft, showToast, values]);

	/** Builds a suggested clarification reason from flagged (unapproved) bills. */
	const buildClarifyReasonPrefix = useCallback((): string => {
		const flagged = savedClaims.filter(
			(item) => item.approvalStatus !== "APPROVED",
		);
		if (flagged.length === 0) return "";
		const lines = flagged.map((item) => {
			const label = item.billNumber
				? `Bill ${item.billNumber}`
				: item.billName || item.claimHead;
			const remark = item.remarks?.trim();
			return remark ? `• ${label}: ${remark}` : `• ${label}: Not approved`;
		});
		return `Flagged line items:\n${lines.join("\n")}`;
	}, [savedClaims]);

	/** Validates an approve / clarify reason; returns an error or null. */
	const validateReason = useCallback(
		(action: ReasonAction, reason: string): string | null => {
			const schema =
				action === "clarify" ? clarificationReasonSchema : approvalReasonSchema;
			const result = schema.safeParse({ reason });
			return result.success ? null : firstErrorMessage(result.error);
		},
		[],
	);

	const handleClarifyConfirm = useCallback(
		async (reason: string) => {
			if (!onClarifyStage) return;
			setClarifyLoading(true);
			try {
				await onClarifyStage(reason.trim());
				setClarifyModalOpen(false);
			} finally {
				setClarifyLoading(false);
			}
		},
		[onClarifyStage],
	);

	const handleApproveStage = useCallback(
		async (reason: string) => {
			await onApproveStage?.(reason.trim());
		},
		[onApproveStage],
	);

	const allLineItemsApproved =
		savedClaims.length > 0 &&
		savedClaims.every((item) => item.approvalStatus === "APPROVED");
	const canCompleteStage =
		canApprove && (isExternalApprover || allLineItemsApproved);
	const approvedTotal = useMemo(
		() =>
			savedClaims
				.filter((item) => item.approvalStatus === "APPROVED")
				.reduce(
					(sum, item) => sum + (Number(resolveApprovedAmount(item)) || 0),
					0,
				),
		[savedClaims],
	);

	const handleReset = useCallback(() => {
		setValues(
			withDeclarationDateDefault(
				{ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues },
				shouldAutofillDeclarationDate,
			),
		);
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
		setClaimRows([createClaimHeadRow()]);
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setEditingClaimId(null);
		setClaimErrors({});
		setErrors({});
		setMutationError(null);
	}, [
		initialAttachments,
		initialLineItems,
		initialValues,
		shouldAutofillDeclarationDate,
	]);

	return {
		values,
		attachments,
		referenceNumber,
		errors,
		claimRows,
		savedClaims,
		claimErrors,
		editingClaimId,
		savingClaimId,
		deletingClaimId,
		approvingClaimId,
		isLoading,
		isSubmitting,
		isSavingDraft,
		mutationError,
		clarifyModalOpen,
		clarifyLoading,
		gradeOptions,
		selectedGrade,
		isGradeLocked,
		resolvedEligibleAmount,
		settledAmount,
		eligibility,
		eligibilityPeriodLabel: resolvedEligibilityPeriodLabel,
		pendingAmount: eligibilityPendingAmount,
		lineItemsTotal,
		approvedTotal,
		isReadOnly,
		canEditClaimForm,
		fieldMode,
		claimStatusLabel,
		canReviewLineItems,
		isLineItemReviewLocked,
		hideReviewColumns,
		allLineItemsApproved,
		canCompleteStage,
		mode,
		actorRole,
		canApprove,
		canClarify,
		canClose,
		isClosing,
		// The backend returns the LAST clarification reason even after the
		// claim moved on — only show it while a clarification is open.
		correctionReason:
			claimStatusLabel?.trim().toUpperCase() === "CLARIFICATION_REQUESTED"
				? correctionReason
				: null,
		isExternalApprover,
		approvalActionLoading,
		onBack,
		submittedMessage,
		actionText,
		commentsSection,
		auditSection,
		workflowSection,
		handleRemarksChange,
		handleSaveRemarks,
		savingRemarksId,
		hasLineItemRemarksSaveAction: Boolean(onLineItemRemarksSave),
		hasSubmitAction: Boolean(onSubmit),
		hasSaveDraftAction: Boolean(onSaveDraft),
		hasApproveStageAction: Boolean(onApproveStage),
		hasClarifyStageAction: Boolean(onClarifyStage),
		hasCloseAction: Boolean(onCloseClaim),
		handleChange,
		handleClaimChange,
		handleSaveClaim,
		handleEditClaim,
		handleDeleteClaim,
		handleCancelClaimEdit,
		handleApprovedAmountChange,
		handleToggleLineItemStatus,
		handleApproveLineItem,
		handleSubmit,
		handleSaveDraft,
		handleReset,
		setClarifyModalOpen,
		buildClarifyReasonPrefix,
		validateReason,
		handleClarifyConfirm,
		handleApproveStage,
		handleCloseClaim: onCloseClaim,
	};
}

export type ReimbursementClaimFormController = ReturnType<
	typeof useReimbursementClaimForm
>;

export const ReimbursementClaimFormContext =
	createContext<ReimbursementClaimFormController | null>(null);

export const useReimbursementClaimFormContext =
	(): ReimbursementClaimFormController => {
		const context = useContext(ReimbursementClaimFormContext);
		if (!context) {
			throw new Error(
				"useReimbursementClaimFormContext must be used within ReimbursementClaimFormContext.Provider.",
			);
		}
		return context;
	};
