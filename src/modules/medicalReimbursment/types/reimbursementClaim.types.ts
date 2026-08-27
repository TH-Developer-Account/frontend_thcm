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

	/** Legacy response fields retained as optional for backward compatibility. */
	ticketNumberOrGrade?: string;
	patientName?: string;
	relationshipWithEmployee?: string;
	medicalAdvanceAmount?: string;
	descriptionOfIllness?: string;
	numberOfVisits?: string;
	visitFeePerVisit?: string;
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

	/**
	 * Local file selected by the user while creating/editing a row.
	 *
	 * This should NOT contain an S3 key or remote URL.
	 */
	file: File | null;

	/**
	 * Normalized file representation used by the UI.
	 *
	 * Can represent both:
	 * - locally selected files
	 * - remotely stored files
	 */
	attachment?: FileUploadValue | null;

	fileName?: string | null;

	approvedClaimAmount?: string | null;

	approvalStatus?: LineItemApprovalStatus;
	remarks?: string | null;
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
