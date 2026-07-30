import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";

export type VendorFormMode = "edit" | "view";

export type VendorOnboardingStatus =
	| "DRAFT"
	| "AWAITING_VENDOR"
	| "VENDOR_SUBMITTED"
	| "IN_REVIEW"
	| "IN_PROGRESS"
	| "THCM_SUBMITTED"
	| "APPROVED"
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
	confirmAccountNumber?: string;
	gstin?: string;
	pan?: string;
	entityRegistrationNumber?: string;
	gstCertificate?: string;
	panNumber?: string;
	bankCancelledCheque?: string;
	certificateOfIncorporation?: string;
	msmeCertificate?: string;
	ndaCertificate?: string;
	ndaObtained?: string;
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

export type VendorUpdatePayload = {
	vendorName?: string | null;
	state?: string | null;
	city?: string | null;
	pinCode?: string | null;
	address?: string | null;
	mobile?: string | null;
	email?: string | null;
	msmeVendor?: boolean | null;
	msmeCertAttached?: boolean | null;
	bankName?: string | null;
	bankBranch?: string | null;
	ifscCode?: string | null;
	bankAddress?: string | null;
	accountNumber?: string | null;
	confirmAccountNumber?: string | null;
	gstin?: string | null;
	pan?: string | null;
	entityRegNo?: string | null;
	vendorCode?: string | null;
	vendorType?: string | null;
	companyCode?: string | null;
	purchaseOrg?: string | null;
	paymentTerm?: string | null;
	tds?: string | null;
	vendorCategory?: string | null;
	materialType?: string | null;
	materialSubType?: string | null;
	selfAssessmentObtained?: boolean | null;
	ndaObtained?: boolean | null;
	gpaObtained?: boolean | null;
	isRelatedParty?: boolean | null;
	vendorAuditReportPrepared?: boolean | null;
	natureOfService?: string | null;
	onboardingReason?: string | null;
	remarks?: string | null;
};

export type VendorOnboardingResponse = {
	id: string;
	status: VendorOnboardingStatus;
	referenceNumber: string | undefined;
	partOne: VendorCreationFormOneValues;
	partTwo: VendorCreationFormTwoValues;
	documents: VendorOnboardingDocument[];
	createdAt?: string;
	updatedAt?: string;
	activeWorkflow?: VendorActiveWorkflow;
};

export type VendorFormErrors<T> = Partial<Record<keyof T, string>>;

export type UpdateVendorVariables = {
	vendorRequestId: string;
	payload: VendorUpdatePayload;
	workspaceId?: string;
	appId?: string;
	isExternalApprover?: boolean;
};

export type VendorClarificationPayload = {
	reason: string;
	comment?: string;
};

export type VendorEnclosureStatusKey =
	| "gstCertificate"
	| "panNumber"
	| "bankCancelledCheque"
	| "certificateOfIncorporation"
	| "msmeCertificate"
	| "ndaCertificate"
	| "otherAttachment";

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
		description: "Required when the vendor is registered under MSME.",
		required: false,
	},
	{
		statusKey: "ndaCertificate",
		documentType: "NDA_CERTIFICATE",
		label: "NDA Certificate",
		description: "Required when NDA has been obtained.",
		required: false,
	},
	{
		statusKey: "otherAttachment",
		documentType: "ADDITIONAL_DOC_1",
		label: "Other Attachment",
		description: "Upload any additional supporting document.",
		required: false,
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
	fileName: string;
	fileUrl: string;
	caption?: string | null;
	mimeType?: string;
	size?: number;
};

export type VendorOnboardingRawDocument = {
	id: string;
	onboardingId: string;
	documentType: VendorDocumentType;
	s3Key: string;
	fileUrl: string;
	caption?: string | null;
	uploadedAt: string;
};

export type VendorOnboardingRawResponse = {
	id: string;
	workspaceId: string;
	initiatedById: string;
	status: VendorOnboardingStatus;
	vendorName: string | null;
	state: string | null;
	city: string | null;
	pinCode: string | null;
	address: string | null;
	mobile: string | null;
	email: string | null;
	msmeVendor: boolean | null;
	msmeCertAttached: boolean | null;
	bankName: string | null;
	bankBranch: string | null;
	ifscCode: string | null;
	bankAddress: string | null;
	accountNumber: string | null;
	confirmAccountNumber?: string | null;
	gstin: string | null;
	pan: string | null;
	entityRegNo: string | null;
	vendorCode: string | null;
	vendorType: string | null;
	companyCode: string | null;
	purchaseOrg: string | null;
	paymentTerm: string | null;
	tds: string | null;
	vendorCategory: string | null;
	materialType: string | null;
	materialSubType: string | null;
	selfAssessmentObtained: boolean | null;
	ndaObtained: boolean | null;
	gpaObtained: boolean | null;
	isRelatedParty: boolean | null;
	vendorAuditReportPrepared: boolean | null;
	natureOfService: string | null;
	onboardingReason: string | null;
	remarks?: string | null;
	documents?: VendorOnboardingRawDocument[];
	activeWorkflow?: VendorActiveWorkflow;
	created_at?: string;
	updated_at?: string;
	referenceNumber?: string;
};

export type VendorActiveWorkflow = {
	id: string;
	templateId: string;
	workspaceId: string;
	iteration: number;
	isActive: boolean;
	workflowType: string;
	status: string;
	currentStage: number;
	appId: string;
	subjectType: string;
	subjectId: string;
	created_at: string;
	updated_at: string;

	template?: {
		id: string;
		name: string;
		description?: string | null;
		metaData_1?: string | null;
	} | null;

	stages: ApprovalStageLike[];
};
