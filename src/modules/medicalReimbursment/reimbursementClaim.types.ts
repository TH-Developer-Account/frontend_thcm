import type { FileUploadValue } from "../../components/ui/FileUpload/fileUpload.types";

export type ReimbursementClaimFormMode = "edit" | "view";

export interface ReimbursementClaimFormValues {
	location: string;
	employeeName: string;
	ticketNumberOrGrade: string;
	patientName: string;
	relationshipWithEmployee: string;
	medicalAdvanceAmount: string;
	companySettledAmount: string;
	descriptionOfIllness: string;
	numberOfVisits: string;
	visitFeePerVisit: string;
	doctorMedicineAmount: string;
	injectionInvestigationAmount: string;
	ecgXrayOtherAmount: string;
	lensCost: string;
	frameCost: string;
	patientAge: string;
	lastHealthCheckupDate: string;
	healthCheckupAmount: string;
	excessHospitalizationAmount: string;
	declarationAccepted: boolean;
	employeeSignature: string;
	claimDate: string;
	officeReference: string;
	officeVisitFeesAmount: string;
	officeMedicalAmount: string;
	officeOphthalmicAmount: string;
	officeHealthCheckupAmount: string;
	officeExcessHospitalizationAmount: string;
	passedBy: string;
	passedAmount: string;
	passedDate: string;
	ticketNumber: string;
}

export type ReimbursementClaimFormErrors = Partial<
	Record<keyof ReimbursementClaimFormValues | "claimedTotal", string>
>;

/**
 * One attachment bucket per claim head, plus a general "additional documents"
 * bucket that isn't tied to a specific head. Each bucket uses your existing
 * FileUploadValue[] shape so it drops straight into <FileUploadField multiple>.
 */
export type ClaimHeadKey =
	| "visitFees"
	| "medical"
	| "ophthalmic"
	| "healthCheckup"
	| "excessHospitalization";
// | "additional";

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
	// additional: [],
};

export interface ReimbursementClaimSubmission {
	values: ReimbursementClaimFormValues;
	attachments: ReimbursementClaimAttachments;
}

/**
 * Approval workflow — kept intentionally separate from the claim's own state
 * (mirrors the create vs. render/consume split already used for the
 * `workflow` module elsewhere on THCM: this component only *renders* stages
 * and reports actions upward via `onApprovalAction`; it doesn't fetch,
 * persist, or own the workflow). Swap in the real
 * ApprovalWorkflowSection/ApprovalTable data shape here once you wire this
 * form to that module.
 */
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

export type ApprovalActionType = "approve" | "reject" | "clarify";

export type ClaimHead =
	| "VISIT_FEES"
	| "MEDICINES_INVESTIGATIONS"
	| "OPHTHALMIC_TREATMENT"
	| "EXECUTIVE_HEALTH_CHECKUP"
	| "EXCESS_HOSPITALISATION";

export type PatientType = "SELF" | "SPOUSE";

export interface ClaimHeadFormRow {
	id: string;

	claimHead: ClaimHead | "";

	billNumber: string;

	billName: string;

	patient: PatientType | "";

	billDate: string;

	amount: string;

	file: File | null;
}

export interface ClaimHeadRow {
	id: string;

	claimHead: ClaimHead;

	billNumber: string;

	billName: string;

	patient: PatientType;

	billDate: string;

	amount: string;

	file: File | null;

	fileName?: string;
}

export type ClaimHeadValidationErrors = Record<string, string>;
