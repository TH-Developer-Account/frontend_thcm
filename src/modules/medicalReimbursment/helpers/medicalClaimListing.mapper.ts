import type {
	MedicalClaimDetail,
	MedicalClaimListItem,
	MedicalClaimListingRow,
	PendingOnValue,
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
import { formatPendingOn as formatPendingOnLabel } from "../../../utils/statusAlert.helper";
import {
	getAuditMessage,
	type AuditLogEntry,
} from "../../../components/ui/audit";

export const toNumber = (value: number | string | null | undefined): number => {
	if (value === null || value === undefined || value === "") return 0;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const toOptionalNumber = (
	value: number | string | null | undefined,
): number | null => {
	if (value === null || value === undefined || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

/** Money as the form stores it: "" when absent, never "null"/"undefined". */
const toAmountString = (value: number | string | null | undefined): string => {
	const parsed = toOptionalNumber(value);
	return parsed === null ? "" : String(parsed);
};

/** "Pending on Asha, Ravi" / "Pending on Ex-Employee" / "Closed" — shared app wording. */
export const formatPendingOn = (
	value: PendingOnValue | undefined,
	status?: string | null,
): string => formatPendingOnLabel(value ?? null, status);

export const toMedicalClaimListingRow = (
	claim: MedicalClaimListItem,
): MedicalClaimListingRow => ({
	id: claim.id,
	referenceNumber: claim.referenceNumber || "—",
	employeeName: claim.employeeName || "—",
	ticketNumber: claim.ticketNumber?.trim() || "—",
	email: claim.email?.trim() || "—",
	mobile: claim.mobile?.trim() || "—",
	grade: claim.grade?.trim() || "—",
	totalClaimed: toNumber(claim.totalClaimed),
	status: claim.status || "--",
	pendingOn: formatPendingOn(claim.pendingOn, claim.status),
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
	coverageType: (claim.claimCover ?? "") as CoverageType,
	spouseName: claim.spouseName ?? "",
	medicalAdvanceAmount: toAmountString(claim.medicalAdvanceTaken),
	companySettledAmount: toAmountString(claim.alreadySettled),
	declarationAccepted: Boolean(claim.declarationAcceptedAt),
	employeeSignature: claim.signatureName ?? "",
	// Empty → the form hook autofills today's date while editable.
	claimDate: toDateInputValue(claim.signatureDate ?? claim.submittedAt),
});

/**
 * Annual cap implied by the server's numbers (eligible = cap - settled), used
 * when the claim's grade isn't in the grade list (e.g. legacy grades).
 */
export const deriveAnnualCap = (claim?: MedicalClaimDetail | null): number | null => {
	if (!claim) return null;
	const eligible = toOptionalNumber(claim.eligibleAmount);
	if (eligible === null) return null;
	return eligible + toNumber(claim.alreadySettled);
};

export const toMedicalClaimLineItems = (
	claim: MedicalClaimDetail,
): ClaimHeadRow[] => {
	const defaultPatient: PatientType =
		claim.claimCover === "SPOUSE" ? "SPOUSE" : "SELF";

	return (claim.bills ?? []).map((bill, index): ClaimHeadRow => {
		const fileName =
			bill.fileName ??
			(bill.s3Key || bill.fileUrl
				? getFileNameFromUrl(bill.s3Key || bill.fileUrl || "")
				: `bill-${index + 1}`);
		const mimeType = bill.mimeType ?? getMimeTypeFromFileName(fileName);

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

		const approved = Boolean(bill.approved);

		return {
			id: bill.id,
			isPersisted: true,
			claimHead: bill.claimHead as ClaimHead,
			billNumber: bill.billNo ?? "",
			billName: bill.billName ?? "",
			patient: defaultPatient,
			billDate: toDateInputValue(bill.billDate),
			amount: toAmountString(bill.amount),
			// Saved backend files are remote: `file` is only for a browser File.
			file: null,
			fileName,
			attachment,
			// Only an APPROVED bill has a meaningful approved amount. For
			// pending bills this stays "" and the review input falls back to
			// the claimed amount — never to 0.
			approvedClaimAmount: approved ? toAmountString(bill.approvedClaimAmount) : "",
			remarks: bill.remarks ?? "",
			approved,
			approvalStatus: approved ? "APPROVED" : "PENDING",
		};
	});
};

export const getMedicalAuditMessage = (entry: AuditLogEntry): string => {
	return getAuditMessage(entry, {
		entityName: "medical claim",

		actionMessages: {
			MEDICAL_CLAIM_INITIATED: ({ actorName }) =>
				`${actorName} initiated the medical claim.`,
			MEDICAL_CLAIM_LINK_RESENT: ({ actorName }) =>
				`${actorName} re-sent the claim form link.`,
			MEDICAL_CLAIM_SUBMITTED: ({ actorName }) =>
				`${actorName} submitted the medical claim.`,
			MEDICAL_CLAIM_RESUBMITTED: ({ actorName }) =>
				`${actorName} resubmitted the medical claim.`,
			MEDICAL_CLAIM_SENT_FOR_APPROVAL: ({ actorName }) =>
				`${actorName} sent the medical claim for approval.`,
			MEDICAL_CLAIM_LINE_ITEMS_REVIEWED: ({ actorName }) =>
				`${actorName} reviewed bill line items.`,
			MEDICAL_CLAIM_CLOSED: ({ actorName }) =>
				`${actorName} closed the medical claim.`,
		},
	});
};
