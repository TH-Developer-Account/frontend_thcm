import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";

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
	documents?: VendorOnboardingDocument[];
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
	payload?: VendorCreationPayload;
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

export type VendorEnclosureStatusKey =
	| "gstCertificate"
	| "panNumber"
	| "bankCancelledCheque"
	| "certificateOfIncorporation"
	| "msmeCertificate"
	| "ndaCertificate";

export const VENDOR_DOCUMENT_FIELDS = [
	{
		statusKey: "gstCertificate",
		documentType: "GST_CERTIFICATE",
		label: "GST Certificate",
		description: "Upload the GST registration certificate.",
		required: true,
	},
	{
		statusKey: "panNumber",
		documentType: "PAN_DOCUMENT",
		label: "PAN Document",
		description: "Upload the vendor PAN document.",
		required: true,
	},
	{
		statusKey: "bankCancelledCheque",
		documentType: "CANCELLED_CHEQUE",
		label: "Cancelled Cheque",
		description: "Upload a cancelled cheque or bank proof.",
		required: true,
	},
	{
		statusKey: "certificateOfIncorporation",
		documentType: "INCORPORATION_CERTIFICATE",
		label: "Incorporation Certificate",
		description: "Upload the certificate of incorporation.",
		required: true,
	},
	{
		statusKey: "msmeCertificate",
		documentType: "MSME_CERTIFICATE",
		label: "MSME Certificate",
		description: "Upload the MSME registration certificate.",
		required: true,
	},
	{
		statusKey: "ndaCertificate",
		documentType: "NDA_CERTIFICATE",
		label: "NDA Certificate",
		description: "Upload the signed NDA certificate.",
		required: true,
	},
] as const;

export type VendorDocumentType =
	(typeof VENDOR_DOCUMENT_FIELDS)[number]["documentType"];

export type VendorDocumentField = (typeof VENDOR_DOCUMENT_FIELDS)[number];

export type VendorDocumentUpload = {
	statusKey: VendorEnclosureStatusKey;
	documentType: VendorDocumentType;
	value: FileUploadValue | null;
	error?: string;
};
export type VendorOnboardingDocument = {
	id: string;
	documentType: VendorDocumentType;
	fileName?: string;
	fileUrl: string;
	mimeType?: string;
	size?: number;
};
