import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

export type ReimbursementClaimFormMode = "edit" | "view";
export type ReimbursementClaimActor =
	| "creator"
	| "approver"
	| "externalApprover";
export type CoverageType = "SELF" | "SPOUSE" | "BOTH" | "";

export interface ReimbursementClaimFormValues {
	location: string;
	employeeName: string;
	ticketNumber: string;
	grade: string;
	coverageType: CoverageType;
	spouseName: string;
	companySettledAmount: string;
	declarationAccepted: boolean;
	claimDate: string;
	medicalAdvanceAmount?: string;
	employeeSignature?: string;
}

export type ReimbursementClaimFormErrors = Partial<
	Record<keyof ReimbursementClaimFormValues | "form", string>
>;

export type ClaimHeadKey =
	| "visitFees"
	| "medical"
	| "ophthalmic"
	| "healthCheckup"
	| "excessHospitalization";

export type ReimbursementClaimAttachments = Record<
	ClaimHeadKey,
	FileUploadValue[]
>;

export const EMPTY_CLAIM_ATTACHMENTS: ReimbursementClaimAttachments = {
	visitFees: [],
	medical: [],
	ophthalmic: [],
	healthCheckup: [],
	excessHospitalization: [],
};

export type ClaimHead =
	| "VISIT_FEES"
	| "MEDICINES_INVESTIGATIONS"
	| "OPHTHALMIC_TREATMENT"
	| "EXECUTIVE_HEALTH_CHECKUP"
	| "EXCESS_HOSPITALISATION";

export type PatientType = "SELF" | "SPOUSE";
export type LineItemApprovalStatus = "PENDING" | "APPROVED";

export interface ClaimHeadRowBase {
	id: string;
	billNumber: string;
	billName: string;
	patient?: PatientType | "";
	billDate: string | undefined;
	amount: string;
	/** Local file selected while creating/editing a row — never an S3 key. */
	file: File | null;
	/** Normalized file (local or remote) used by the UI. */
	attachment?: FileUploadValue | null;
	fileName?: string | null;
	approvedClaimAmount?: string | null;
	approvalStatus?: LineItemApprovalStatus;
	remarks?: string | null;
	approved?: boolean;
	/** true for rows that exist on the server (have a real bill id). */
	isPersisted?: boolean;
}

export interface ClaimHeadRow extends ClaimHeadRowBase {
	claimHead: ClaimHead;
	billDate: string;
}

export interface ClaimHeadFormRow extends ClaimHeadRowBase {
	claimHead: ClaimHead | "";
}

export type ClaimHeadSubmissionRow = ClaimHeadRow;

export interface ReimbursementClaimSubmission {
	values: ReimbursementClaimFormValues;
	attachments: ReimbursementClaimAttachments;
	lineItems: ClaimHeadSubmissionRow[];
	totalAmountEligible: number;
	lineItemsTotal: number;
}

export interface ApprovalStage {
	id: string;
	stageName?: string;
	approverName: string;
	status: string;
	comment?: string;
	actedOn?: string;
}

export type ClaimHeadValidationErrors = Record<string, string>;

/** Grade + annual cap. `eligibility` is null when the cap isn't known. */
export interface GradeOption {
	label: string;
	value: string;
	eligibility: number | null;
}

/** Where the claim form is being shown — drives what the claimant can see. */
export type MedicalClaimFormContext = "public" | "guest" | "internal";
