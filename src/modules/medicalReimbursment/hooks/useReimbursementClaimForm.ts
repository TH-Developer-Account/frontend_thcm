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
import { createClaimHeadRow } from "../helpers/reimbursementClaimForm.helper";
import {
	EMPTY_CLAIM_ATTACHMENTS,
	type ApprovalStage,
	type ClaimHead,
	type ClaimHeadFormRow,
	type ClaimHeadRow,
	type ClaimHeadValidationErrors,
	type CoverageType,
	type ReimbursementClaimActor,
	type ReimbursementClaimAttachments,
	type ReimbursementClaimFormErrors,
	type ReimbursementClaimFormMode,
	type ReimbursementClaimFormValues,
	type ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";

export const GRADE_OPTIONS = [
	{ label: "M1", value: "M1", eligibility: 25_000 },
	{ label: "M2", value: "M2", eligibility: 35_000 },
	{ label: "M3", value: "M3", eligibility: 45_000 },
	{ label: "M4", value: "M4", eligibility: 60_000 },
	{ label: "M5", value: "M5", eligibility: 75_000 },
	{ label: "E1", value: "E1", eligibility: 100_000 },
	{ label: "E2", value: "E2", eligibility: 125_000 },
	{ label: "E3", value: "E3", eligibility: 150_000 },
];

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
};

const REQUIRED_FIELDS: Array<keyof ReimbursementClaimFormValues> = [
	"location",
	"employeeName",
	"ticketNumber",
	"grade",
	"coverageType",
	"claimDate",
	"declarationAccepted",
];
const DRAFT_REQUIRED_FIELDS: Array<keyof ReimbursementClaimFormValues> = [
	"ticketNumber",
	"grade",
	"location",
];
export type ApprovedBillAmountPayload = ClaimHeadRow;

export interface UseReimbursementClaimFormArgs {
	referenceNumber?: string;
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
	if (firstDot === -1) return cleaned;
	const whole = cleaned.slice(0, firstDot);
	const fraction = cleaned
		.slice(firstDot + 1)
		.replace(/\./g, "")
		.slice(0, 2);
	return `${whole}.${fraction}`;
}

export function sanitizeWholeNumberInput(raw: string): string {
	return raw.replace(/[^0-9]/g, "");
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

export function useReimbursementClaimForm({
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
	referenceNumber,
}: UseReimbursementClaimFormArgs) {
	const { showToast } = useToast();
	const [values, setValues] = useState<ReimbursementClaimFormValues>({
		...EMPTY_REIMBURSEMENT_CLAIM_VALUES,
		...initialValues,
	});
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
		setValues({ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues });
		setErrors({});
		setMutationError(null);
	}, [initialValues, initialValuesKey]);

	useEffect(() => {
		if (syncedAttachmentsKey.current === initialAttachmentsKey) return;
		syncedAttachmentsKey.current = initialAttachmentsKey;
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
	}, [initialAttachments, initialAttachmentsKey]);

	useEffect(() => {
		if (syncedLineItemsKey.current === initialLineItemsKey) return;
		syncedLineItemsKey.current = initialLineItemsKey;
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setClaimRows([createClaimHeadRow()]);
		setEditingClaimId(null);
		setClaimErrors({});
	}, [initialLineItems, initialLineItemsKey]);

	const selectedGrade = useMemo(
		() => GRADE_OPTIONS.find((option) => option.value === values.grade),
		[values.grade],
	);
	const resolvedEligibleAmount = selectedGrade?.eligibility ?? 0;
	const lineItemsTotal = useMemo(
		() =>
			savedClaims.reduce(
				(total, item) => total + (Number(item.amount) || 0),
				0,
			),
		[savedClaims],
	);
	const isReadOnly =
		mode === "view" || !canEdit || actorRole === "externalApprover";
	const canEditClaimForm = !isReadOnly;
	const fieldMode: ReimbursementClaimFormMode = isReadOnly ? "view" : "edit";
	const claimStatusLabel =
		statusLabel ?? deriveClaimStatusLabel(approvalStages);
	const canReviewLineItems = canApprove;
	const isLoading = isSubmitting || isSavingDraft;

	const clearClaimError = useCallback((key: string) => {
		setClaimErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, []);

	const handleChange = useCallback(
		<K extends keyof ReimbursementClaimFormValues>(
			field: K,
			value: ReimbursementClaimFormValues[K],
		) => {
			setValues((current) => ({ ...current, [field]: value }));
			setErrors((current) => {
				if (!current[field]) return current;
				const next = { ...current };
				delete next[field];
				return next;
			});
		},
		[],
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
			clearClaimError(`${field === "attachment" ? "file" : field}-${rowId}`);
		},
		[clearClaimError],
	);

	const validateClaim = useCallback(
		(row: ClaimHeadFormRow): ClaimHeadValidationErrors => {
			const validation: ClaimHeadValidationErrors = {};
			if (!row.claimHead)
				validation[`claimHead-${row.id}`] = "Claim head is required.";
			if (!row.billNumber.trim())
				validation[`billNumber-${row.id}`] = "Bill number is required.";
			if (!row.billName.trim())
				validation[`billName-${row.id}`] = "Bill name is required.";
			if (!row.billDate)
				validation[`billDate-${row.id}`] = "Bill date is required.";
			if (!row.amount || Number(row.amount) <= 0)
				validation[`amount-${row.id}`] = "Amount is required.";
			if (!row.attachment?.file && !row.attachment?.url && !row.file) {
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

	const handleApproveLineItem = useCallback(
		async (claim: ClaimHeadRow) => {
			if (!onLineItemApprove) {
				handleToggleLineItemStatus(claim.id);
				return;
			}
			setApprovingClaimId(claim.id);
			try {
				await onLineItemApprove(claim);
				handleToggleLineItemStatus(claim.id);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unable to approve this line item. Please try again.";
				showToast({ type: "error", title: "Error", description: message });
			} finally {
				setApprovingClaimId(null);
			}
		},
		[handleToggleLineItemStatus, onLineItemApprove, showToast],
	);

	const handleRemarksChange = useCallback(
		(id: string, value: string) => {
			if (!canReviewLineItems) return;
			setSavedClaims((current) =>
				current.map((claim) =>
					claim.id === id ? { ...claim, remarks: value } : claim,
				),
			);
		},
		[canReviewLineItems],
	);

	const buildSubmission = useCallback(
		(): ReimbursementClaimSubmission => ({
			values: {
				...values,
				spouseName:
					values.coverageType === "SELF" || !values.coverageType
						? ""
						: values.spouseName,
			},
			attachments,
			lineItems: savedClaims.map((item) => ({
				...item,
				fileName:
					item.file?.name ?? item.attachment?.name ?? item.fileName ?? null,
			})),
			totalAmountEligible: resolvedEligibleAmount,
			lineItemsTotal,
		}),
		[attachments, lineItemsTotal, resolvedEligibleAmount, savedClaims, values],
	);

	const validateForm = useCallback((): ReimbursementClaimFormErrors => {
		const nextErrors: ReimbursementClaimFormErrors = {};
		REQUIRED_FIELDS.forEach((field) => {
			if (!String(values[field] ?? "").trim())
				nextErrors[field] = "This field is required.";
		});
		if (
			(values.coverageType === "SPOUSE" || values.coverageType === "BOTH") &&
			!values.spouseName.trim()
		) {
			nextErrors.spouseName = "Spouse name is required.";
		}
		if (!values.declarationAccepted) {
			nextErrors.declarationAccepted =
				"Please accept the declaration to continue.";
		}
		return nextErrors;
	}, [values]);

	const handleSubmit = useCallback(async () => {
		const nextErrors = validateForm();
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;
		if (savedClaims.length === 0) {
			setClaimErrors((current) => ({
				...current,
				form: "Add at least one claim line item before submitting.",
			}));
			return;
		}
		setMutationError(null);
		setIsSubmitting(true);
		try {
			await onSubmit?.(buildSubmission());
			showToast({
				type: "success",
				title: "Success",
				description: "Medical claim submitted successfully.",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to submit the medical claim. Please try again.";
			setMutationError(message);
			showToast({ type: "error", title: "Error", description: message });
		} finally {
			setIsSubmitting(false);
		}
	}, [buildSubmission, onSubmit, savedClaims.length, showToast, validateForm]);

	const validateDraft = useCallback((): ReimbursementClaimFormErrors => {
		const nextErrors: ReimbursementClaimFormErrors = {};

		DRAFT_REQUIRED_FIELDS.forEach((field) => {
			if (!String(values[field] ?? "").trim()) {
				nextErrors[field] = "This field is required to save a draft.";
			}
		});

		if (!values.coverageType) {
			nextErrors.coverageType = "Please select a coverage type.";
		}

		if (
			(values.coverageType === "SPOUSE" || values.coverageType === "BOTH") &&
			!values.spouseName.trim()
		) {
			nextErrors.spouseName = "Spouse name is required.";
		}

		return nextErrors;
	}, [values]);

	const handleSaveDraft = useCallback(async () => {
		const nextErrors = validateDraft();

		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		setMutationError(null);
		setIsSavingDraft(true);

		try {
			await onSaveDraft?.(buildSubmission());

			showToast({
				type: "success",
				title: "Success",
				description: "Medical claim draft saved successfully.",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to save the medical claim draft. Please try again.";

			setMutationError(message);

			showToast({
				type: "error",
				title: "Error",
				description: message,
			});
		} finally {
			setIsSavingDraft(false);
		}
	}, [buildSubmission, onSaveDraft, showToast, validateDraft]);

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

	const handleClarifyConfirm = useCallback(
		async (reason: string) => {
			if (!onClarifyStage) return;
			setClarifyLoading(true);
			try {
				await onClarifyStage(reason);
				setClarifyModalOpen(false);
			} finally {
				setClarifyLoading(false);
			}
		},
		[onClarifyStage],
	);

	const allLineItemsApproved =
		savedClaims.length > 0 &&
		savedClaims.every((item) => item.approvalStatus === "APPROVED");
	const canCompleteStage =
		canApprove && (isExternalApprover || allLineItemsApproved);

	const handleReset = useCallback(() => {
		setValues({ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues });
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
		setClaimRows([createClaimHeadRow()]);
		setSavedClaims(initialLineItems.map((item) => ({ ...item })));
		setEditingClaimId(null);
		setClaimErrors({});
		setErrors({});
		setMutationError(null);
	}, [initialAttachments, initialLineItems, initialValues]);

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
		selectedGrade,
		resolvedEligibleAmount,
		lineItemsTotal,
		isReadOnly,
		canEditClaimForm,
		fieldMode,
		claimStatusLabel,
		canReviewLineItems,
		allLineItemsApproved,
		canCompleteStage,
		mode,
		actorRole,
		canApprove,
		canClarify,
		isExternalApprover,
		approvalActionLoading,
		onBack,
		submittedMessage,
		actionText,
		commentsSection,
		workflowSection,
		hasSubmitAction: Boolean(onSubmit),
		hasSaveDraftAction: Boolean(onSaveDraft),
		hasApproveStageAction: Boolean(onApproveStage),
		hasClarifyStageAction: Boolean(onClarifyStage),
		handleChange,
		handleClaimChange,
		handleSaveClaim,
		handleEditClaim,
		handleDeleteClaim,
		handleCancelClaimEdit,
		handleApprovedAmountChange,
		handleToggleLineItemStatus,
		handleApproveLineItem,
		handleRemarksChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
		setClarifyModalOpen,
		buildClarifyReasonPrefix,
		handleClarifyConfirm,
		handleApproveStage: onApproveStage,
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
