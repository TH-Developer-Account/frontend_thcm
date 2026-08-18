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
	doctorMedicineAmount?: string;
	injectionInvestigationAmount?: string;
	ecgXrayOtherAmount?: string;
	lensCost?: string;
	frameCost?: string;
	patientAge?: string;
	lastHealthCheckupDate?: string;
	healthCheckupAmount?: string;
	excessHospitalizationAmount?: string;
	employeeSignature?: string;
	officeReference?: string;
	officeVisitFeesAmount?: string;
	officeMedicalAmount?: string;
	officeOphthalmicAmount?: string;
	officeHealthCheckupAmount?: string;
	officeExcessHospitalizationAmount?: string;
	passedBy?: string;
	passedAmount?: string;
	passedDate?: string;
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

interface ClaimHeadRowBase {
	id: string;
	billNumber: string;
	billName: string;
	patient?: PatientType | "";
	billDate: string | undefined;
	amount: string;
	file: File | null;
	attachment?: FileUploadValue | null;
	fileName?: string | null;
	approvedAmount?: string;
	approvalStatus?: LineItemApprovalStatus;
}

export interface ClaimHeadRow extends ClaimHeadRowBase {
	claimHead: ClaimHead;
	// patient: PatientType;
	billDate: string;
}

export interface ClaimHeadFormRow extends ClaimHeadRowBase {
	claimHead: ClaimHead | "";
}

export type ClaimHeadSubmissionRow = Omit<ClaimHeadRow, "attachment">;

export interface ReimbursementClaimSubmission {
	values: ReimbursementClaimFormValues;
	attachments: ReimbursementClaimAttachments;
	lineItems: ClaimHeadSubmissionRow[];
	totalAmountEligible: number;
	lineItemsTotal: number;
}

export type ApprovalStageStatus =
	| "pending"
	| "in_review"
	| "approved"
	| "rejected"
	| "clarification_requested";

export interface ApprovalStage {
	id: string;
	stageName?: string;
	approverName: string;
	status: ApprovalStageStatus;
	comment?: string;
	actedOn?: string;
}

export type ApprovalActionType =
	| "approve"
	| "reject"
	| "clarify"
	| "request_clarification";

export type ClaimHeadValidationErrors = Record<string, string>;

// const createEmptyClaimRow = (): ClaimHeadFormRow => ({
// 	id: crypto.randomUUID(),
// 	claimHead: "",
// 	billNumber: "",
// 	billName: "",
// 	patient: "",
// 	billDate: "",
// 	amount: "",
// 	file: null,
// 	attachment: null,
// });
