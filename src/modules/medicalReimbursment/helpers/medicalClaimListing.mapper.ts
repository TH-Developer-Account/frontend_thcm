import type {
	MedicalClaimDetail,
	MedicalClaimListItem,
	MedicalClaimListingRow,
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
import {
	getAuditMessage,
	type AuditLogEntry,
} from "../../../components/ui/audit";

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
	status: claim.status || "--",
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
		const fileName =
			bill.fileName ?? getFileNameFromUrl(bill.s3Key || bill.fileUrl || "");

		const mimeType = getMimeTypeFromFileName(fileName);

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

			approvedClaimAmount: bill.approvedClaimAmount ?? "",

			remarks: bill.remarks ?? null,
			approvalStatus: bill.approved ? "APPROVED" : "PENDING",
		};
	});
};

export const getMedicalAuditMessage = (entry: AuditLogEntry): string => {
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
