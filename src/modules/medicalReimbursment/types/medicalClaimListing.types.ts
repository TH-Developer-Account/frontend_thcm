export type MedicalClaimListingTab =
	| "initiation"
	| "claims"
	| "pendingOnMe"
	| "approvedByMe";

export type MedicalClaimStatus =
	| "AWAITING_EX_EMPLOYEE"
	| "DRAFT"
	| "IN_PROGRESS"
	| "CLARIFICATION_REQUESTED"
	| "APPROVED"
	| "REJECTED"
	| "CLOSED";

export interface MedicalClaimListItem {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber?: string | null;
	mobile?: string | null;
	email?: string | null;
	grade?: string | null;
	location?: string | null;
	status: MedicalClaimStatus;
	totalClaimed?: number | string | null;
	eligibleAmount?: number | string | null;
	submittedAt?: string | null;
	created_at: string;
	updated_at?: string | null;
}

export interface MedicalClaimListingRow {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber: string;
	grade: string;
	totalClaimed: number;
	status: MedicalClaimStatus;
	statusLabel: string;
	createdAt: string;
}

export interface MedicalClaimListingParams {
	tab: MedicalClaimListingTab;
	search?: string;
	pageIndex: number;
	pageSize: number;
}

export interface MedicalClaimListingApiResponse {
	success: boolean;
	data: MedicalClaimListItem[];
	total: number;
	page_index: number;
	page_size: number;
}

export interface MedicalClaimListingResult {
	rows: MedicalClaimListItem[];
	totalCount: number;
	pageIndex: number;
	pageSize: number;
}

export interface MedicalClaimInitiationPayload {
	employeeName: string;
	email: string;
	mobile: string;
	ticketNumber: string;
}

export interface MedicalClaimBill {
	id: string;
	claimHead: string;
	billNo?: string | null;
	billName?: string | null;
	billDate?: string | null;
	amount?: number | string | null;
	s3Key?: string | null;
	fileName?: string | null;
	fileUrl?: string | null;
	approvedAmount?: number | string | null;
	approvalStatus?: "PENDING" | "APPROVED";
}

export interface MedicalClaimDetail extends MedicalClaimListItem {
	guestId?: string | null;
	patientName?: string | null;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	spouseName?: string | null;
	medicalAdvanceTaken?: number | string | null;
	alreadySettled?: number | string | null;
	declarationAcceptedAt?: string | null;
	signatureName?: string | null;
	signatureDate?: string | null;
	bills?: MedicalClaimBill[];
}

export interface MedicalClaimMutationResponse {
	success?: boolean;
	message?: string;
	data?: MedicalClaimDetail;
}
