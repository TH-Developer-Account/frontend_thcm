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
import { createRemoteFileUploadValue } from "../../../components/ui/FileUpload/fileUpload.helpers";

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

const getFileName = (s3Key?: string | null): string | null =>
	s3Key?.split(/[\\/]/).pop() || null;

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

	return (claim.bills ?? []).map((bill) => {
		const fileName = bill.fileName ?? getFileName(bill.s3Key);
		return {
			id: bill.id,
			claimHead: bill.claimHead as ClaimHead,
			billNumber: bill.billNo ?? "",
			billName: bill.billName ?? "",
			patient: defaultPatient,
			billDate: toDateInputValue(bill.billDate),
			amount: String(bill.amount ?? ""),
			file: null,
			fileName,
			attachment: bill.fileUrl
				? createRemoteFileUploadValue({
						id: bill.id,
						url: bill.fileUrl,
						name: fileName ?? null,
						fallbackName: fileName ?? "Medical claim bill",
					})
				: null,
			approvedAmount: String(bill.approvedAmount ?? bill.amount ?? ""),
			approvalStatus: bill.approvalStatus ?? "PENDING",
		};
	});
};
