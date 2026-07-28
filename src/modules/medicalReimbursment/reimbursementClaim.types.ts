export type ReimbursementClaimFormMode = "edit" | "view";

export interface ReimbursementClaimFormValues {
	officeReference: string;
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

	healthCheckupAmount: string;
	patientAge: string;
	lastHealthCheckupDate: string;

	excessHospitalizationAmount: string;

	declarationAccepted: boolean;
	employeeSignature: string;
	claimDate: string;

	officeVisitFeesAmount: string;
	officeMedicalAmount: string;
	officeOphthalmicAmount: string;
	officeHealthCheckupAmount: string;
	officeExcessHospitalizationAmount: string;
	passedBy: string;
	passedAmount: string;
	passedDate: string;
}

export type ReimbursementClaimFormErrors = Partial<
	Record<keyof ReimbursementClaimFormValues | "claimedTotal", string>
>;

export interface ReimbursementClaimCategoryTotals {
	visitFees: number;
	medical: number;
	ophthalmic: number;
	healthCheckup: number;
	excessHospitalization: number;
}

export interface ReimbursementClaimSubmission {
	values: ReimbursementClaimFormValues;
	categoryTotals: ReimbursementClaimCategoryTotals;
	claimedTotal: number;
	officeApprovedTotal: number;
}

export const EMPTY_REIMBURSEMENT_CLAIM_VALUES: ReimbursementClaimFormValues = {
	officeReference: "",
	location: "",
	employeeName: "",
	ticketNumberOrGrade: "",
	patientName: "",
	relationshipWithEmployee: "",

	medicalAdvanceAmount: "",
	companySettledAmount: "",
	descriptionOfIllness: "",

	numberOfVisits: "",
	visitFeePerVisit: "",

	doctorMedicineAmount: "",
	injectionInvestigationAmount: "",
	ecgXrayOtherAmount: "",

	lensCost: "",
	frameCost: "",

	healthCheckupAmount: "",
	patientAge: "",
	lastHealthCheckupDate: "",

	excessHospitalizationAmount: "",

	declarationAccepted: false,
	employeeSignature: "",
	claimDate: "",

	officeVisitFeesAmount: "",
	officeMedicalAmount: "",
	officeOphthalmicAmount: "",
	officeHealthCheckupAmount: "",
	officeExcessHospitalizationAmount: "",
	passedBy: "",
	passedAmount: "",
	passedDate: "",
};
