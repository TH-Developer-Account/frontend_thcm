import type { MedicalClaimStatus } from "../types/medicalClaimListing.types";

export const MEDICAL_CLAIM_STATUS_LABELS: Record<MedicalClaimStatus, string> = {
	AWAITING_EX_EMPLOYEE: "Awaiting employee",
	IN_PROGRESS: "In progress",
	CLARIFICATION_REQUESTED: "Clarification requested",
	APPROVED: "Approved",
	REJECTED: "Rejected",
	CLOSED: "Closed",
};

export const normalizeStatus = (status?: string | null): string =>
	String(status ?? "")
		.trim()
		.toUpperCase();

export const getStatusLabel = (status?: string | null): string => {
	const normalized = normalizeStatus(status) as MedicalClaimStatus;
	return MEDICAL_CLAIM_STATUS_LABELS[normalized] ?? (status || "--");
};

/** Token form is editable until the claim is submitted. */
export const PUBLIC_EDITABLE_STATUSES = new Set<string>(["AWAITING_EX_EMPLOYEE"]);

/** Guest portal can edit only after an approver sends it back (backend rule). */
export const GUEST_EDITABLE_STATUSES = new Set<string>(["CLARIFICATION_REQUESTED"]);
