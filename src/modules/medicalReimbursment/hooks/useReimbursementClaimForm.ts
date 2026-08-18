import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import {
	EMPTY_CLAIM_ATTACHMENTS,
	type ApprovalStage,
	type ClaimHeadKey,
	type ReimbursementClaimAttachments,
	type ReimbursementClaimFormErrors,
	type ReimbursementClaimFormValues,
	type ReimbursementClaimSubmission,
} from "../types/reimbursementClaim.types";

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
];

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

interface UseReimbursementClaimFormArgs {
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
	buildSubmission: (
		values: ReimbursementClaimFormValues,
		attachments: ReimbursementClaimAttachments,
	) => ReimbursementClaimSubmission;
}

export function useReimbursementClaimForm({
	initialValues,
	initialAttachments,
	onSubmit,
	onSaveDraft,
	buildSubmission,
}: UseReimbursementClaimFormArgs) {
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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [mutationError, setMutationError] = useState<string | null>(null);
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
	const syncedValuesKey = useRef(initialValuesKey);
	const syncedAttachmentsKey = useRef(initialAttachmentsKey);

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

	const handleAttachmentsChange = useCallback(
		(head: ClaimHeadKey, nextFiles: FileUploadValue[]) => {
			setAttachments((current) => ({ ...current, [head]: nextFiles }));
		},
		[],
	);

	const validate = useCallback((): ReimbursementClaimFormErrors => {
		const nextErrors: ReimbursementClaimFormErrors = {};
		REQUIRED_FIELDS.forEach((field) => {
			if (!String(values[field] ?? "").trim()) {
				nextErrors[field] = "This field is required.";
			}
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

	const submission = useMemo(
		() => buildSubmission(values, attachments),
		[attachments, buildSubmission, values],
	);

	const handleSubmit = useCallback(async () => {
		const nextErrors = validate();
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;
		setMutationError(null);
		setIsSubmitting(true);
		try {
			await onSubmit?.(submission);
		} catch (error) {
			setMutationError(
				error instanceof Error
					? error.message
					: "Something went wrong while submitting the claim.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [onSubmit, submission, validate]);

	const handleSaveDraft = useCallback(async () => {
		setMutationError(null);
		setIsSavingDraft(true);
		try {
			await onSaveDraft?.(submission);
		} catch (error) {
			setMutationError(
				error instanceof Error
					? error.message
					: "Something went wrong while saving the draft.",
			);
		} finally {
			setIsSavingDraft(false);
		}
	}, [onSaveDraft, submission]);

	const handleReset = useCallback(() => {
		setValues({ ...EMPTY_REIMBURSEMENT_CLAIM_VALUES, ...initialValues });
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
		setErrors({});
		setMutationError(null);
	}, [initialAttachments, initialValues]);

	return {
		values,
		attachments,
		errors,
		isLoading: isSubmitting || isSavingDraft,
		isSubmitting,
		isSavingDraft,
		mutationError,
		handleChange,
		handleAttachmentsChange,
		handleSubmit,
		handleSaveDraft,
		handleReset,
	};
}
