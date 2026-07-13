export type VendorFormMode = "edit" | "view";

export type VendorOnboardingStatus =
	| "DRAFT"
	| "SUBMITTED_BY_VENDOR"
	| "THCM_REVIEW_IN_PROGRESS"
	| "THCM_SUBMITTED"
	| "THCM_CLARIFICATION_REQUESTED"
	| "THCM_APPROVED"
	| "EXTERNAL_REVIEW_PENDING"
	| "EXTERNAL_ACCEPTED"
	| "CLOSED";

export type VendorViewerRole =
	| "EXTERNAL_VENDOR"
	| "THCM_EMPLOYEE"
	| "THCM_APPROVER"
	| "EXTERNAL_APPROVER";

export type VendorCreationFormOneValues = {
	vendorName?: string;
	completeAddress?: string;
	msmeVendor?: string;
	msmeCertificateAttached?: string;
	city?: string;
	pinCode?: string;
	state?: string;

	mobile?: string;
	email?: string;

	bank?: string;
	branch?: string;
	ifscCode?: string;
	bankAddress?: string;
	accountNumber?: string;

	gstin?: string;
	pan?: string;
	entityRegistrationNumber?: string;

	gstCertificate?: string;
	panNumber?: string;
	bankCancelledCheque?: string;
	certificateOfIncorporation?: string;
	msmeCertificate?: string;
	ndaCertificate?: string;
};

export type VendorCreationFormTwoValues = {
	vendorCode?: string;
	vendorType?: string;
	companyCode?: string;
	purchaseOrg?: string;

	paymentTerm?: string;
	tds?: string;

	vendorCategory?: string;
	materialType?: string;
	materialSubType?: string;

	vendorSelfAssessmentObtained?: string;
	ndaObtained?: string;
	gpaObtained?: string;
	relatedPartyToThcm?: string;
	vendorAuditReportPrepared?: string;
	remarks?: string;
	natureOfService?: string;
	reasonForOnboarding?: string;

	proposedByName?: string;
	proposedByDesignation?: string;
	proposedDate?: string;

	approvedByName?: string;
	approvedByDesignation?: string;
	approvalDate?: string;
};

export type VendorCreationPayload = {
	partOne: VendorCreationFormOneValues;
	partTwo: VendorCreationFormTwoValues;
	status?: VendorOnboardingStatus;
};

export type VendorClarificationPayload = {
	reason: string;
	comment?: string;
};

export type VendorCommentPayload = {
	comment: string;
};

export type VendorOnboardingResponse = {
	id: string;
	status: VendorOnboardingStatus;
	partOne: VendorCreationFormOneValues;
	partTwo: VendorCreationFormTwoValues;
	createdAt?: string;
	updatedAt?: string;
};

export type VendorFormErrors<T> = Partial<Record<keyof T, string>>;

export type CreateVendorFormOneVariables = {
	payload: VendorCreationFormOneValues;
};

export type UpdateVendorFormOneVariables = {
	vendorRequestId: string;
	payload: VendorCreationFormOneValues;
};

export type CreateVendorFormTwoVariables = {
	vendorRequestId: string;
	payload: VendorCreationFormTwoValues;
};

export type UpdateVendorFormTwoVariables = {
	vendorRequestId: string;
	payload: VendorCreationFormTwoValues;
};

export type SubmitVendorSummaryVariables = {
	vendorRequestId: string;
	payload: VendorCreationPayload;
};

export type DeleteVendorVariables = {
	vendorRequestId: string;
};

export type ClarifyVendorVariables = {
	vendorRequestId: string;
	payload: VendorClarificationPayload;
};

export type CommentVendorVariables = {
	vendorRequestId: string;
	payload: VendorCommentPayload;
};
