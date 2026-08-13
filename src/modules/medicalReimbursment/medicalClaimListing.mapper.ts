import type {
	MedicalClaimListItem,
	MedicalClaimListingRow,
	MedicalClaimStatus,
} from "./medicalClaimListing.types";

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
