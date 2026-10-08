export type MedicalClaimListingTab =
	| "initiation"
	| "claims"
	| "pendingOnMe"
	| "approvedByMe";

/** Statuses the backend can return (see mediclaim.validation.ts). */
export type MedicalClaimStatus =
	| "AWAITING_EX_EMPLOYEE"
	| "IN_PROGRESS"
	| "CLARIFICATION_REQUESTED"
	| "APPROVED"
	| "REJECTED"
	| "CLOSED";

import type { PendingOn } from "../../../utils/statusAlert.helper";

/** Shape returned by resolveMedicalClaimPendingOn (see utils/statusAlert.helper). */
export type PendingOnValue = PendingOn | null;

export interface MedicalClaimListItem {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber?: string | null;
	mobile?: string | null;
	email?: string | null;
	grade?: string | null;
	location?: string | null;
	status: string;
	totalClaimed?: number | string | null;
	eligibleAmount?: number | string | null;
	submittedAt?: string | null;
	created_at: string;
	updated_at?: string | null;
	pendingOn?: PendingOnValue;
}

export interface MedicalClaimListingRow {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber: string;
	email: string;
	mobile: string;
	grade: string;
	totalClaimed: number;
	status: string;
	pendingOn: string;
	createdAt: string;
}

export interface MedicalClaimListingParams {
	tab: MedicalClaimListingTab;
	search?: string;
	status?: MedicalClaimStatus;
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
	mimeType?: string | null;
	size?: number | string | null;
	approvedClaimAmount?: string | number | null;
	approvalStatus?: "PENDING" | "APPROVED";
	approved: boolean;
	remarks?: string | null;
}

export interface MedicalClaimDetail extends MedicalClaimListItem {
	guestId?: string | null;
	initiatedById?: string | null;
	patientName?: string | null;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	spouseName?: string | null;
	medicalAdvanceTaken?: number | string | null;
	alreadySettled?: number | string | null;
	declarationAcceptedAt?: string | null;
	signatureName?: string | null;
	signatureDate?: string | null;
	/** Latest clarification reason (only while CLARIFICATION_REQUESTED). */
	correctionReason?: string | null;
	/** THCM only — claimed amounts in this person's other open claims this FY. */
	pendingInOtherClaims?: number | string | null;
	bills: MedicalClaimBill[];
}

export interface MedicalClaimMutationResponse {
	success?: boolean;
	message?: string;
	mailSent?: boolean;
	data?: MedicalClaimDetail;
}

export type MedicalClaimExportFormat = "xlsx" | "csv";

export type ExportListingParams = {
	tab: MedicalClaimListingTab;
	search?: string;
	status?: MedicalClaimStatus;
	format?: MedicalClaimExportFormat;
};

export type MedicalClaimExportQueueResponse = {
	success: boolean;
	message: string;
	jobId: string;
	logId: string;
	pollUrl: string;
};

export type MedicalClaimExportJobStatus =
	| "waiting"
	| "active"
	| "delayed"
	| "prioritized"
	| "completed"
	| "failed";

export type MedicalClaimExportStatusResponse = {
	success: boolean;
	jobId: string;
	status: MedicalClaimExportJobStatus;
	downloadUrl: string | null;
	failedReason?: string;
};

export type GradeEligibilityRow = { grade: string; annualCap: number };

/** Response row of PATCH /:id/bills/approved-amounts. */
export type ReviewedBill = {
	id: string;
	approved: boolean;
	approvedClaimAmount: number | null;
	remarks: string | null;
};
