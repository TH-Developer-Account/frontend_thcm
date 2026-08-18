import { useCallback, useMemo, useState } from "react";

import {
	EMPTY_CLAIM_ATTACHMENTS,
	type ApprovalStage,
	type ClaimHeadKey,
	type ReimbursementClaimAttachments,
	type ReimbursementClaimFormErrors,
	type ReimbursementClaimFormValues,
	type ReimbursementClaimSubmission,
} from "./reimbursementClaim.types";
import type { FileUploadValue } from "../../components/ui/FileUpload/fileUpload.types";

const EMPTY_VALUES: ReimbursementClaimFormValues = {
	location: "",
	employeeName: "",
	ticketNumberOrGrade: "",
	patientName: "",
	relationshipWithEmployee: "",
	medicalAdvanceAmount: "",
	companySettledAmount: "",
	descriptionOfIllness: "",
	numberOfVisits: "",
	visitFeePerVisit: "",
	doctorMedicineAmount: "",
	injectionInvestigationAmount: "",
	ecgXrayOtherAmount: "",
	lensCost: "",
	frameCost: "",
	patientAge: "",
	lastHealthCheckupDate: "",
	healthCheckupAmount: "",
	excessHospitalizationAmount: "",
	declarationAccepted: false,
	employeeSignature: "",
	claimDate: "",
	officeReference: "",
	officeVisitFeesAmount: "",
	officeMedicalAmount: "",
	officeOphthalmicAmount: "",
	officeHealthCheckupAmount: "",
	officeExcessHospitalizationAmount: "",
	passedBy: "",
	passedAmount: "",
	passedDate: "",
};

const REQUIRED_FIELDS: Array<keyof ReimbursementClaimFormValues> = [
	"location",
	"employeeName",
	"ticketNumberOrGrade",
	"patientName",
	"relationshipWithEmployee",
	"descriptionOfIllness",
	"employeeSignature",
	"claimDate",
];
export function deriveClaimStatusLabel(stages: ApprovalStage[]): string {
	if (!stages.length) return "Draft";
	if (stages.some((stage) => stage.status === "rejected")) return "Rejected";
	if (stages.every((stage) => stage.status === "approved")) return "Approved";
	if (stages.some((stage) => stage.status === "clarification_requested"))
		return "Clarification Requested";
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

const toNumber = (raw: string): number => {
	const parsed = parseFloat(raw);
	return Number.isFinite(parsed) ? parsed : 0;
};

interface UseReimbursementClaimFormArgs {
	initialValues?: Partial<ReimbursementClaimFormValues>;
	initialAttachments?: Partial<ReimbursementClaimAttachments>;
	onSubmit?: (submission: ReimbursementClaimSubmission) => void | Promise<void>;
	onSaveDraft?: (
		submission: ReimbursementClaimSubmission,
	) => void | Promise<void>;
}

export function useReimbursementClaimForm({
	initialValues,
	initialAttachments,
	onSubmit,
	onSaveDraft,
}: UseReimbursementClaimFormArgs) {
	const [values, setValues] = useState<ReimbursementClaimFormValues>({
		...EMPTY_VALUES,
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

	const categoryTotals = useMemo(
		() => ({
			visitFees:
				toNumber(values.numberOfVisits) * toNumber(values.visitFeePerVisit),
			medical:
				toNumber(values.doctorMedicineAmount) +
				toNumber(values.injectionInvestigationAmount) +
				toNumber(values.ecgXrayOtherAmount),
			ophthalmic: toNumber(values.lensCost) + toNumber(values.frameCost),
		}),
		[values],
	);

	const claimedTotal = useMemo(
		() =>
			categoryTotals.visitFees +
			categoryTotals.medical +
			categoryTotals.ophthalmic +
			toNumber(values.healthCheckupAmount) +
			toNumber(values.excessHospitalizationAmount),
		[
			categoryTotals,
			values.healthCheckupAmount,
			values.excessHospitalizationAmount,
		],
	);

	const officeApprovedTotal = useMemo(
		() =>
			toNumber(values.officeVisitFeesAmount) +
			toNumber(values.officeMedicalAmount) +
			toNumber(values.officeOphthalmicAmount) +
			toNumber(values.officeHealthCheckupAmount) +
			toNumber(values.officeExcessHospitalizationAmount),
		[
			values.officeVisitFeesAmount,
			values.officeMedicalAmount,
			values.officeOphthalmicAmount,
			values.officeHealthCheckupAmount,
			values.officeExcessHospitalizationAmount,
		],
	);

	const handleChange = useCallback(
		(field: keyof ReimbursementClaimFormValues, value: string | boolean) => {
			setValues((prev) => ({ ...prev, [field]: value }));
			setErrors((prev) =>
				prev[field] ? { ...prev, [field]: undefined } : prev,
			);
		},
		[],
	);

	const handleAttachmentsChange = useCallback(
		(head: ClaimHeadKey, nextFiles: FileUploadValue[]) => {
			setAttachments((prev) => ({ ...prev, [head]: nextFiles }));
		},
		[],
	);

	const validate = useCallback((): ReimbursementClaimFormErrors => {
		const nextErrors: ReimbursementClaimFormErrors = {};

		REQUIRED_FIELDS.forEach((field) => {
			if (!String(values[field]).trim()) {
				nextErrors[field] = "This field is required.";
			}
		});

		if (!values.declarationAccepted) {
			nextErrors.declarationAccepted =
				"Please accept the declaration to continue.";
		}

		if (claimedTotal <= 0) {
			nextErrors.claimedTotal =
				"Add at least one claimable amount before submitting.";
		}

		return nextErrors;
	}, [values, claimedTotal]);

	const handleSubmit = useCallback(async () => {
		console.log("Submitting reimbursement claim form with values:", values);
		const nextErrors = validate();
		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setMutationError(null);
		setIsSubmitting(true);
		try {
			await onSubmit?.({ values, attachments });
		} catch (error) {
			setMutationError(
				error instanceof Error
					? error.message
					: "Something went wrong while submitting the claim.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [validate, onSubmit, values, attachments]);

	const handleSaveDraft = useCallback(async () => {
		setMutationError(null);
		setIsSavingDraft(true);
		try {
			await onSaveDraft?.({ values, attachments });
		} catch (error) {
			setMutationError(
				error instanceof Error
					? error.message
					: "Something went wrong while saving the draft.",
			);
		} finally {
			setIsSavingDraft(false);
		}
	}, [onSaveDraft, values, attachments]);

	const handleReset = useCallback(() => {
		setValues({ ...EMPTY_VALUES, ...initialValues });
		setAttachments({ ...EMPTY_CLAIM_ATTACHMENTS, ...initialAttachments });
		setErrors({});
		setMutationError(null);
	}, [initialValues, initialAttachments]);

	return {
		values,
		attachments,
		errors,
		categoryTotals,
		claimedTotal,
		officeApprovedTotal,
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
