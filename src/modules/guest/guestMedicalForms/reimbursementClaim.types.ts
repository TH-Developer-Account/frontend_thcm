import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

export type ReimbursementClaimMode = "create" | "edit" | "view";

export type ReimbursementClaimStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "IN_PROGRESS"
	| "CLARIFICATION_REQUESTED"
	| "RESUBMITTED"
	| "APPROVED"
	| "REJECTED"
	| "CANCELLED";

export type ClaimFor = "SELF" | "SPOUSE" | "BOTH";

export type ClaimHeadKey =
	| "CONSULTATION"
	| "DIAGNOSTIC_TEST"
	| "MEDICINE"
	| "DENTAL"
	| "OTHER";

export type EmployeeGrade = "A" | "B" | "C" | "D" | "E";

export type ClaimantDetails = {
	employeeName: string;
	employeeCode: string;
	ticketNumber: string;
	grade: EmployeeGrade | "";
	department: string;
	claimFor: ClaimFor;
	spouseName?: string;
};

export type ReimbursementClaimLineItem = {
	id?: string;
	clientId: string;
	claimHead: ClaimHeadKey;
	billNumber: string;
	billName: string;
	patientName: string;
	billDate: string;
	amount: number;
	attachment: FileUploadValue | null;
};

export type ReimbursementEligibility = {
	medicalAdvanceTaken: number;
	amountSettledThisCalendarYear: number;
	totalAmountEligible: number;
	availableAmount: number;
};

export type ReimbursementClaimFormValues = ClaimantDetails & {
	claimItems: ReimbursementClaimLineItem[];
	remarks: string;
};

/** JSON fields sent with the multipart request. Attachments are appended separately. */
export type ReimbursementClaimPayload = Omit<
	ReimbursementClaimFormValues,
	"claimItems"
> & {
	claimItems: Array<Omit<ReimbursementClaimLineItem, "attachment">>;
};

export type ReimbursementClaimCreatedBy = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	avatarUrl?: string | null;
};

export type ReimbursementClaimResponse = {
	id: string;
	claimNumber: string;
	status: ReimbursementClaimStatus;
	form: ReimbursementClaimFormValues;
	eligibility: ReimbursementEligibility;
	totalClaimAmount: number;
	createdBy?: ReimbursementClaimCreatedBy | null;
	createdAt: string;
	updatedAt: string;
	submittedAt?: string | null;
	activeWorkflow?: unknown;
};

export type ReimbursementListingTab =
	| "createdByMe"
	| "pendingOnMe"
	| "approvedByMe";

export type ReimbursementClaimListParams = {
	tab: ReimbursementListingTab;
	search?: string;
	status?: ReimbursementClaimStatus | "ALL";
	pageIndex: number;
	pageSize: number;
};

export type ReimbursementClaimListItem = Pick<
	ReimbursementClaimResponse,
	| "id"
	| "claimNumber"
	| "status"
	| "totalClaimAmount"
	| "createdBy"
	| "createdAt"
	| "updatedAt"
> & {
	employeeName: string;
	ticketNumber: string;
	claimFor: ClaimFor;
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

export type PublicClaimSessionResponse = {
	sessionCode: string;
	expiresAt: string;
	claim?: ReimbursementClaimResponse | null;
};
