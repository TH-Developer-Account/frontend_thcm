import type { ClaimHeadRow } from "../../medicalReimbursment/types/reimbursementClaim.types";

export type ReimbursementClaimMode = "create" | "edit" | "view";

/** Mirrors the backend MedicalClaim status values. */
export type ReimbursementClaimStatus =
	| "AWAITING_EX_EMPLOYEE"
	| "IN_PROGRESS"
	| "CLARIFICATION_REQUESTED"
	| "APPROVED"
	| "REJECTED"
	| "CLOSED";

export type ClaimFor = "SELF" | "SPOUSE" | "BOTH";

export type ClaimantDetails = {
	employeeName: string;
	ticketNumber: string;
	grade: string;
	claimFor: ClaimFor;
	spouseName?: string;
};

export type ReimbursementClaimFormValues = ClaimantDetails & {
	claimItems: ClaimHeadRow[];
	remarks: string;
};

export type ReimbursementListingTab = "createdByMe";

export type ReimbursementClaimListParams = {
	tab: ReimbursementListingTab;
	search?: string;
	pageIndex: number;
	pageSize: number;
};

export type ReimbursementClaimListItem = {
	id: string;
	claimNumber: string;
	status: ReimbursementClaimStatus | string;
	totalClaimAmount: number;
	createdAt: string;
	updatedAt: string;
	employeeName: string;
	ticketNumber: string;
	claimFor: ClaimFor;
	totalApprovedAmount: number;
	/** e.g. "2 / 3" bills approved. */
	approvedBillsLabel: string;
	isApproved: boolean;
	/** Latest clarification reason while CLARIFICATION_REQUESTED. */
	remarks: string;
};

export type ReimbursementClaimListResponse = {
	items: ReimbursementClaimListItem[];
	pageIndex: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export type UpdateReimbursementClaimVariables = {
	claimId: string;
	formData: FormData;
};
