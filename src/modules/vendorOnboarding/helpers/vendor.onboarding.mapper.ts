import type { FileUploadValue } from "../../../components/ui/FileUpload/fileUpload.types";
import {
	createRemoteFileUploadValue,
	getFileNameFromUrl,
	getMimeTypeFromFileName,
} from "../../../components/ui/FileUpload/fileUpload.helpers";
import type { ActivateFirstStageEdit } from "../../workflows/api/workflow.api";
import type { WorkflowStage } from "../../workflows/types/types";
import type { PublicVendorSessionResponse } from "../api/vendorOnboarding.api";
import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorCreationFormTwoValues,
	type VendorDocumentType,
	type VendorEnclosureStatusKey,
	type VendorOnboardingDocument,
	type VendorOnboardingRawResponse,
	type VendorOnboardingResponse,
	type VendorUpdatePayload,
} from "../types/vendorOnboarding.types";
import {
	toNullableBoolean,
	toNullableString,
	toYesNo,
} from "./vendor.onboarding.helper";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type VendorEnclosureUploadItem = {
	statusKey: VendorEnclosureStatusKey;
	documentType: VendorDocumentType;
	value: FileUploadValue | null;
};

export type VendorCreationFormOneSubmission = {
	dpdpConsent: true;
	enclosureUploads: VendorEnclosureUploadItem[];
};

export type VendorCreationFormOneDraftSubmission = {
	dpdpConsent: boolean;
	enclosureUploads: VendorEnclosureUploadItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// getCreatedById
// ─────────────────────────────────────────────────────────────────────────────

export const getCreatedById = (createdBy: unknown): string => {
	if (typeof createdBy === "string") return createdBy;

	if (
		typeof createdBy === "object" &&
		createdBy !== null &&
		"id" in createdBy &&
		typeof createdBy.id === "string"
	) {
		return createdBy.id;
	}

	return "";
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizePublicFormOneValues
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM_ONE_VALUES: VendorCreationFormOneValues = {
	vendorName: "",
	address: "",
	state: "",
	city: "",
	pinCode: "",
	mobile: "",
	email: "",
	msmeVendor: "",
	msmeCertificateAttached: "",
	ndaObtained: "",
};

export const normalizePublicFormOneValues = (
	data: PublicVendorSessionResponse,
): VendorCreationFormOneValues => {
	const source = (
		data.partOne && Object.keys(data.partOne).length > 0 ? data.partOne : data
	) as VendorCreationFormOneValues & {
		msmeVendor?: boolean | string | null;
		ndaObtained?: boolean | string | null;
	};

	return {
		...EMPTY_FORM_ONE_VALUES,
		...source,
		vendorName: source.vendorName ?? data.vendorName ?? "",
		referenceName: source.referenceName ?? data.referenceName ?? "",
		email: source.email ?? data.email ?? "",
		mobile: source.mobile ?? data.mobile ?? "",
		msmeVendor: toYesNo(source.msmeVendor),
		ndaObtained: toYesNo(source.ndaObtained),
	};
};

// ─────────────────────────────────────────────────────────────────────────────
// Document → upload-value mapping
// ─────────────────────────────────────────────────────────────────────────────

export const getDocumentCaption = (
	document: VendorOnboardingDocument,
): string =>
	(document as VendorOnboardingDocument & { caption?: string | null })
		.caption ?? "";

export const createVendorDocumentUploadValue = (
	document: VendorOnboardingDocument,
): FileUploadValue =>
	createRemoteFileUploadValue({
		id: document.id,
		url: document.fileUrl,
		name: document.fileName,
		type: document.mimeType,
		size: document.size,
		caption: document.caption,
		fallbackName: document.documentType,
	});

export const createInitialEnclosureUploads = (
	initialDocuments: VendorOnboardingDocument[] = [],
): VendorEnclosureUploadItem[] => {
	const singleDocumentUploads = VENDOR_DOCUMENT_FIELDS.filter(
		(field) => field.documentType !== "ADDITIONAL_DOC_1",
	).map((field) => {
		const document = initialDocuments.find(
			(item) => item.documentType === field.documentType,
		);

		if (!document) {
			return {
				statusKey: field.statusKey,
				documentType: field.documentType,
				value: null,
			};
		}

		return {
			statusKey: field.statusKey,
			documentType: field.documentType,
			value: createVendorDocumentUploadValue(document),
		};
	});

	const otherField = VENDOR_DOCUMENT_FIELDS.find(
		(field) => field.documentType === "ADDITIONAL_DOC_1",
	);
	const otherUploads: VendorEnclosureUploadItem[] = otherField
		? initialDocuments
				.filter((document) => document.documentType === "ADDITIONAL_DOC_1")
				.map((document) => ({
					statusKey: otherField.statusKey,
					documentType: otherField.documentType,
					value: createVendorDocumentUploadValue(document),
				}))
		: [];

	return [...singleDocumentUploads, ...otherUploads];
};

// ─────────────────────────────────────────────────────────────────────────────
// Workflow payload mapping
// ─────────────────────────────────────────────────────────────────────────────

export const mapStageEditsForApi = (
	stages: WorkflowStage[],
): ActivateFirstStageEdit[] =>
	stages.map((stage) => ({
		stageOrder: stage.stageOrder,
		strategy: stage.strategy,
		minApprovals:
			stage.strategy === "SOME" ? Number(stage.minApprovals) || 1 : undefined,
		approvers: stage.approvers.map((approver) => ({
			approverId: approver.user.id,
			isExternalApprover: approver.isExternalApprover,
		})),
	}));

export const getCreatedWorkflowId = (value: unknown): string | null => {
	let current = value;

	for (let depth = 0; depth < 3; depth += 1) {
		if (
			typeof current !== "object" ||
			current === null ||
			Array.isArray(current)
		) {
			return null;
		}

		const record = current as Record<string, unknown>;
		const id = record.id ?? record.workflowId ?? record.templateId;

		if (typeof id === "string" || typeof id === "number") {
			return String(id);
		}

		current = record.data ?? record.workflow;
	}

	return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Form values → update-payload mapping
// ─────────────────────────────────────────────────────────────────────────────

export const buildVendorUpdatePayload = (
	values: VendorCreationFormOneValues,
): VendorUpdatePayload => ({
	vendorName: toNullableString(values.vendorName),
	state: toNullableString(values.state),
	city: toNullableString(values.city),
	pinCode: toNullableString(values.pinCode),
	address: toNullableString(values.address),
	mobile: toNullableString(values.mobile),
	email: toNullableString(values.email),
	msmeVendor: toNullableBoolean(values.msmeVendor),
	msmeCertAttached: toNullableBoolean(values.msmeCertificateAttached),
	bankName: toNullableString(values.bankName),
	bankBranch: toNullableString(values.bankBranch),
	ifscCode: toNullableString(values.ifscCode),
	bankAddress: toNullableString(values.bankAddress),
	accountNumber: toNullableString(values.accountNumber),
	// NOTE: confirmAccountNumber is intentionally NOT included here.
	// It is a frontend-only validation field — the backend has no such
	// column and must never receive it. If you're adding a new field to
	// this payload, don't reflexively include confirmAccountNumber too.
	gstin: toNullableString(values.gstin),
	pan: toNullableString(values.pan),
	entityRegNo: toNullableString(values.entityRegNo),
	ndaObtained: toNullableBoolean(values.ndaObtained),
	referenceName: toNullableString(values.referenceName),
});

export const buildThcmUpdatePayload = (
	values: VendorCreationFormTwoValues,
): VendorUpdatePayload => ({
	vendorCode: toNullableString(values.vendorCode),
	vendorType: toNullableString(values.vendorType),
	companyCode: toNullableString(values.companyCode),
	purchaseOrg: toNullableString(values.purchaseOrg),
	paymentTerm: toNullableString(values.paymentTerm),
	tds: toNullableString(values.tds),
	vendorCategory: toNullableString(values.vendorCategory),
	materialType: toNullableString(values.materialType),
	materialSubType: toNullableString(values.materialSubType),
	selfAssessmentObtained: toNullableBoolean(
		values.vendorSelfAssessmentObtained,
	),
	gpaObtained: toNullableBoolean(values.gpaObtained),
	isRelatedParty: toNullableBoolean(values.relatedPartyToThcm),
	vendorAuditReportPrepared: toNullableBoolean(
		values.vendorAuditReportPrepared,
	),
	natureOfService: toNullableString(values.natureOfService),
	onboardingReason: toNullableString(values.reasonForOnboarding),
	// remarks: toNullableString(values.remarks),
});

export const buildVendorOnboardingUpdatePayload = (
	formOneValues: VendorCreationFormOneValues,
	formTwoValues: VendorCreationFormTwoValues,
): VendorUpdatePayload => ({
	...buildVendorUpdatePayload(formOneValues),
	...buildThcmUpdatePayload(formTwoValues),
});

export const buildVendorCodeUpdatePayload = (
	vendorCode?: string,
): VendorUpdatePayload => ({
	vendorCode: vendorCode?.trim() || null,
});

// ─────────────────────────────────────────────────────────────────────────────
// Raw API response → view-model mapping
// ─────────────────────────────────────────────────────────────────────────────

export const normalizeVendorOnboardingResponse = (
	raw: VendorOnboardingRawResponse,
): VendorOnboardingResponse => {
	const documents = (raw.documents ?? []).map((document) => {
		const fileName = getFileNameFromUrl(
			document.s3Key || document.fileUrl,
			document.documentType,
		);

		return {
			id: document.id,
			documentType: document.documentType,
			fileName,
			fileUrl: document.fileUrl,
			mimeType: getMimeTypeFromFileName(fileName),
		};
	});

	const hasDocument = (type: VendorDocumentType): boolean =>
		documents.some((document) => document.documentType === type);

	const getDocumentStatus = (type: VendorDocumentType): string =>
		toYesNo(hasDocument(type));

	return {
		id: raw.id,
		status: raw.status,
		partOne: {
			vendorName: raw.vendorName ?? "",
			referenceName: raw.referenceName ?? "",
			address: raw.address ?? "",
			msmeVendor: toYesNo(raw.msmeVendor),
			msmeCertificateAttached: toYesNo(raw.msmeCertAttached),
			city: raw.city ?? "",
			pinCode: raw.pinCode ?? "",
			state: raw.state ?? "",
			mobile: raw.mobile ?? "",
			email: raw.email ?? "",
			bankName: raw.bankName ?? "",
			bankBranch: raw.bankBranch ?? "",
			ifscCode: raw.ifscCode ?? "",
			bankAddress: raw.bankAddress ?? "",
			accountNumber: raw.accountNumber ?? "",
			confirmAccountNumber: raw.accountNumber ?? "",
			gstin: raw.gstin ?? "",
			pan: raw.pan ?? "",
			entityRegNo: raw.entityRegNo ?? "",
			gstCertificate: getDocumentStatus("GST_CERTIFICATE"),
			panNumber: getDocumentStatus("PAN_DOCUMENT"),
			bankCancelledCheque: getDocumentStatus("CANCELLED_CHEQUE"),
			certificateOfIncorporation: getDocumentStatus(
				"INCORPORATION_CERTIFICATE",
			),
			msmeCertificate: getDocumentStatus("MSME_CERTIFICATE"),
			ndaCertificate: getDocumentStatus("NDA_CERTIFICATE"),
			ndaObtained: hasDocument("NDA_CERTIFICATE")
				? "Yes"
				: toYesNo(raw.ndaObtained),
		},
		partTwo: {
			vendorCode: raw.vendorCode ?? "",
			vendorType: raw.vendorType ?? "",
			companyCode: raw.companyCode ?? "",
			purchaseOrg: raw.purchaseOrg ?? "",
			paymentTerm: raw.paymentTerm ?? "",
			tds: raw.tds ?? "",
			vendorCategory: raw.vendorCategory ?? "",
			materialType: raw.materialType ?? "",
			materialSubType: raw.materialSubType ?? "",
			vendorSelfAssessmentObtained: toYesNo(raw.selfAssessmentObtained),
			gpaObtained: toYesNo(raw.gpaObtained),
			relatedPartyToThcm: toYesNo(raw.isRelatedParty),
			vendorAuditReportPrepared: toYesNo(raw.vendorAuditReportPrepared),
			natureOfService: raw.natureOfService ?? "",
			reasonForOnboarding: raw.onboardingReason ?? "",
			// remarks: raw.remarks ?? "",
		},
		documents,
		activeWorkflow: raw.activeWorkflow,
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
		referenceNumber: raw.referenceNumber,
		initiatedById: raw.initiatedById,
		createdBy: raw.created_by ?? null,
	};
};

// ─────────────────────────────────────────────────────────────────────────────
// Public-form submission → FormData mapping
// ─────────────────────────────────────────────────────────────────────────────

export const buildPublicFormData = (
	values: VendorCreationFormOneValues,
	submission:
		| VendorCreationFormOneSubmission
		| VendorCreationFormOneDraftSubmission,
	submitType: "DRAFT" | "SUBMIT",
) => {
	const formData = new FormData();
	const payload = buildVendorUpdatePayload(values);

	Object.entries(payload).forEach(([key, value]) => {
		formData.append(key, value === null ? "" : String(value));
	});

	formData.append("submitType", submitType);
	formData.append("dpdpConsent", String(submission.dpdpConsent));

	submission.enclosureUploads.forEach(
		({ documentType, value }: VendorEnclosureUploadItem) => {
			if (value?.file instanceof File) {
				formData.append(
					documentType,
					value.file,
					value.name || value.file.name,
				);
			}
		},
	);

	return formData;
};
