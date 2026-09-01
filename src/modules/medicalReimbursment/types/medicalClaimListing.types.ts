export type MedicalClaimListingTab =
	| "initiation"
	| "claims"
	| "pendingOnMe"
	| "approvedByMe";

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
}

export interface MedicalClaimListingRow {
	id: string;
	referenceNumber: string;
	employeeName: string;
	ticketNumber: string;
	grade: string;
	totalClaimed: number;
	status: string;
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
	/**
	 * Same fields the vendor onboarding flow gets on every document
	 * (mimeType, size) and feeds straight into createRemoteFileUploadValue.
	 * Optional here because not every backend response for a bill includes
	 * them yet (see toMedicalClaimLineItems — falls back to filename-based
	 * type detection when mimeType is absent).
	 */
	mimeType?: string | null;
	size?: number | string | null;
	approvedClaimAmount?: string;
	approvalStatus?: "PENDING" | "APPROVED";
	approved: boolean;
	remarks?: string | null;
}

export interface MedicalClaimDetail extends MedicalClaimListItem {
	guestId?: string | null;
	claimCover?: "SELF" | "SPOUSE" | "BOTH" | null;
	spouseName?: string | null;
	medicalAdvanceTaken?: number | string | null;
	alreadySettled?: number | string | null;
	declarationAcceptedAt?: string | null;
	signatureName?: string | null;
	signatureDate?: string | null;
	bills: MedicalClaimBill[];
}

export interface MedicalClaimMutationResponse {
	success?: boolean;
	message?: string;
	data?: MedicalClaimDetail;
}
export type MedicalClaimExportFormat = "xlsx" | "csv";

export type ExportListingParams = {
	tab: MedicalClaimListingTab;
	search?: string;
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
