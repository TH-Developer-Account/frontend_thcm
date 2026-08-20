import type {
	MedicalClaimDetail,
	MedicalClaimListItem,
	MedicalClaimListingRow,
	MedicalClaimStatus,
} from "../types/medicalClaimListing.types";

import type {
	ClaimHead,
	ClaimHeadRow,
	CoverageType,
	PatientType,
	ReimbursementClaimFormValues,
} from "../types/reimbursementClaim.types";

import {
	createRemoteFileUploadValue,
	getFileNameFromUrl,
	getMimeTypeFromFileName,
} from "../../../components/ui/FileUpload/fileUpload.helpers";

import { getAuditMessage } from "../../../components/ui/comments/comments.helper";
import type { CommentItem } from "../../../components/ui/comments";

const STATUS_LABELS: Record<MedicalClaimStatus, string> = {
	AWAITING_EX_EMPLOYEE: "Awaiting employee",
	DRAFT: "Draft",
	IN_PROGRESS: "In progress",
	CLARIFICATION_REQUESTED: "Clarification requested",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	CLOSED: "Closed",
};

const toNumber = (value: number | string | null | undefined): number => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : 0;
};

export const toMedicalClaimListingRow = (
	claim: MedicalClaimListItem,
): MedicalClaimListingRow => ({
	id: claim.id,
	referenceNumber: claim.referenceNumber || "—",
	employeeName: claim.employeeName || "—",
	ticketNumber: claim.ticketNumber?.trim() || "—",
	grade: claim.grade?.trim() || "—",
	totalClaimed: toNumber(claim.totalClaimed),
	status: claim.status,
	statusLabel: STATUS_LABELS[claim.status] ?? claim.status,
	createdAt: claim.created_at,
});

const toDateInputValue = (value?: string | null): string =>
	value ? value.slice(0, 10) : "";

export const toMedicalClaimFormValues = (
	claim: MedicalClaimDetail,
): Partial<ReimbursementClaimFormValues> => ({
	employeeName: claim.employeeName ?? "",
	ticketNumber: claim.ticketNumber ?? "",
	grade: claim.grade ?? "",
	location: claim.location ?? "",
	patientName: claim.patientName ?? "",
	coverageType: (claim.claimCover ?? "") as CoverageType,
	spouseName: claim.spouseName ?? "",
	medicalAdvanceAmount: String(claim.medicalAdvanceTaken ?? ""),
	companySettledAmount: String(claim.alreadySettled ?? ""),
	declarationAccepted: Boolean(claim.declarationAcceptedAt),
	employeeSignature: claim.signatureName ?? "",
	claimDate: toDateInputValue(claim.signatureDate ?? claim.submittedAt),
});

export const toMedicalClaimLineItems = (
	claim: MedicalClaimDetail,
): ClaimHeadRow[] => {
	const defaultPatient: PatientType =
		claim.claimCover === "SPOUSE" ? "SPOUSE" : "SELF";

	return (claim.bills ?? []).map((bill): ClaimHeadRow => {
		/**
		 * Backend may provide either:
		 *
		 * - fileName
		 * - s3Key
		 * - fileUrl
		 *
		 * We always derive a stable display filename first.
		 */
		const fileName =
			bill.fileName ??
			getFileNameFromUrl(bill.s3Key || bill.fileUrl || "", bill.claimHead);

		/**
		 * Derive MIME type from the filename.
		 *
		 * We don't rely on the backend to provide mimeType.
		 */
		const mimeType = getMimeTypeFromFileName(fileName);

		/**
		 * Remote attachment used by the UI.
		 *
		 * This is the important part:
		 *
		 * attachment.url → actual preview URL
		 * attachment.name → displayed filename
		 *
		 * The S3 key should NOT be assigned to `file`.
		 */
		const attachment = bill.fileUrl
			? createRemoteFileUploadValue({
					id: bill.id,
					url: bill.fileUrl,
					name: fileName,
					type: mimeType,
					size: bill.size != null ? Number(bill.size) : undefined,
					fallbackName: fileName,
				})
			: null;

		return {
			id: bill.id,

			claimHead: bill.claimHead as ClaimHead,

			billNumber: bill.billNo ?? "",

			billName: bill.billName ?? "",

			patient: defaultPatient,

			billDate: toDateInputValue(bill.billDate),

			amount: String(bill.amount ?? ""),

			/**
			 * Saved backend files are remote.
			 *
			 * Do NOT assign bill.s3Key here because `file`
			 * represents a browser File object.
			 */
			file: null,

			fileName,

			attachment,

			approvedClaimAmount: String(
				bill.approvedClaimAmount ?? bill.amount ?? "",
			),

			approvalStatus: bill.approvalStatus ?? "PENDING",
		};
	});
};

export const getMedicalAuditMessage = (entry: CommentItem): string => {
	return getAuditMessage(entry, {
		entityName: "medical claim",

		actionMessages: {
			MEDICAL_CLAIM_INITIATED: ({ actorName }) =>
				`${actorName} initiated the medical claim.`,

			MEDICAL_CLAIM_SUBMITTED: ({ actorName }) =>
				`${actorName} submitted the medical claim.`,

			MEDICAL_CLAIM_RESUBMITTED: ({ actorName }) =>
				`${actorName} resubmitted the medical claim.`,

			MEDICAL_CLAIM_SENT_FOR_APPROVAL: ({ actorName }) =>
				`${actorName} sent the medical claim for approval.`,

			MEDICAL_CLAIM_CLOSED: ({ actorName }) =>
				`${actorName} closed the medical claim.`,
		},
	});
};
