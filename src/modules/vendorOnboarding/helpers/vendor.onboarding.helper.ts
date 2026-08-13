import type {
	VendorCreationFormOneDraftSubmission,
	VendorCreationFormOneSubmission,
	VendorEnclosureUploadItem,
} from "../hooks/useVendorCreationForm";
import type { VendorListingFilter } from "../types/vendorListing.types";
import {
	VENDOR_DOCUMENT_FIELDS,
	type VendorCreationFormOneValues,
	type VendorCreationFormTwoValues,
	type VendorDocumentType,
	type VendorOnboardingRawResponse,
	type VendorOnboardingResponse,
	type VendorUpdatePayload,
} from "../types/vendorOnboarding.types";
import {
	getFileNameFromUrl,
	getMimeTypeFromFileName,
} from "../../../components/ui/FileUpload/fileUpload.helpers";

export const toYesNo = (value: boolean | string | null | undefined): string => {
	if (typeof value === "boolean") return value ? "Yes" : "No";
	const normalized = value?.trim().toLowerCase();
	if (normalized === "yes" || normalized === "true") return "Yes";
	if (normalized === "no" || normalized === "false") return "No";
	return "";
};

export const toNullableBoolean = (
	value: string | boolean | null | undefined,
): boolean | null => {
	if (typeof value === "boolean") return value;
	const normalized = value?.trim().toLowerCase();
	if (normalized === "yes" || normalized === "true") return true;
	if (normalized === "no" || normalized === "false") return false;
	return null;
};

const toNullableString = (value?: string): string | null =>
	value?.trim() || null;

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
	gstin: toNullableString(values.gstin),
	pan: toNullableString(values.pan),
	entityRegNo: toNullableString(values.entityRegNo),
	ndaObtained: toNullableBoolean(values.ndaObtained),
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
	remarks: toNullableString(values.remarks),
});

export const buildVendorOnboardingUpdatePayload = (
	formOneValues: VendorCreationFormOneValues,
	formTwoValues: VendorCreationFormTwoValues,
): VendorUpdatePayload => ({
	...buildVendorUpdatePayload(formOneValues),
	...buildThcmUpdatePayload(formTwoValues),
});

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
			remarks: raw.remarks ?? "",
		},
		documents,
		activeWorkflow: raw.activeWorkflow,
		createdAt: raw.created_at,
		updatedAt: raw.updated_at,
		referenceNumber: raw.referenceNumber,
		initiatedById: raw.initiatedById,
	};
};

export const buildPublicFormData = (
	values: VendorCreationFormOneValues,
	submission:
		| VendorCreationFormOneSubmission
		| VendorCreationFormOneDraftSubmission,
	submitType: "DRAFT" | "SUBMIT", // NEW
) => {
	const formData = new FormData();
	const payload = buildVendorUpdatePayload(values);

	Object.entries(payload).forEach(([key, value]) => {
		formData.append(key, value === null ? "" : String(value));
	});

	formData.append("submitType", submitType); // NEW
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
export const buildVendorCodeUpdatePayload = (
	vendorCode?: string,
): VendorUpdatePayload => ({
	vendorCode: vendorCode?.trim() || null,
});

export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error &&
		typeof error.response === "object" &&
		error.response !== null &&
		"data" in error.response &&
		typeof error.response.data === "object" &&
		error.response.data !== null &&
		"message" in error.response.data &&
		typeof error.response.data.message === "string"
	) {
		return error.response.data.message;
	}
	return error instanceof Error ? error.message : fallback;
};

export const getMissingDocuments = (
	submission: VendorCreationFormOneSubmission,
	values: VendorCreationFormOneValues,
	requireDocuments = true,
): string[] => {
	if (!requireDocuments) {
		return [];
	}

	const uploadedDocumentTypes = new Set(
		submission.enclosureUploads
			.filter((upload) => Boolean(upload.value?.file || upload.value?.url))
			.map((upload) => upload.documentType),
	);

	return VENDOR_DOCUMENT_FIELDS.filter((field) => {
		if (field.documentType === "MSME_CERTIFICATE") {
			return values.msmeVendor === "Yes";
		}

		if (field.documentType === "NDA_CERTIFICATE") {
			return values.ndaObtained === "Yes";
		}

		return field.required;
	})
		.filter((field) => !uploadedDocumentTypes.has(field.documentType))
		.map((field) => field.label);
};

export const getOnboardingSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	switch (filter) {
		case "createdByMe":
			return "Search vendor requests created by me";

		case "pendingOnMe":
			return "Search approvals pending on me";

		case "approvedByMe":
			return "Search vendor requests approved by me";

		default:
			return "Search vendor onboarding records";
	}
};
export const getInitiationSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	switch (filter) {
		case "createdByMe":
			return "Search initiation requests created by me";

		case "pendingOnMe":
			return "Search initiation requests pending on me";

		case "approvedByMe":
			return "Search initiation requests approved by me";
		default:
			return "No vendor initiation requests found";
	}
};

export const getInitiationEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	switch (filter) {
		case "createdByMe":
			return {
				title: "No initiation requests created by you",
				description: "Vendor initiation requests you create will appear here.",
			};

		case "pendingOnMe":
			return {
				title: "No initiation requests are pending on you",
				description:
					"Vendor initiation requests requiring your action will appear here.",
			};

		case "approvedByMe":
			return {
				title: "No initiation requests approved by you",
				description: "Vendor initiation requests you approve will appear here.",
			};
		default:
			return {
				title: "No vendor initiation requests found",
				description: "Vendor initiation form entries will appear here.",
			};
	}
};

export const getOnboardingEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	switch (filter) {
		case "createdByMe":
			return {
				title: "No vendor requests created by you",
				description: "Vendor onboarding requests you create will appear here.",
			};

		case "pendingOnMe":
			return {
				title: "No approvals are pending on you",
				description:
					"Vendor onboarding requests requiring your approval will appear here.",
			};

		case "approvedByMe":
			return {
				title: "No vendor requests approved by you",
				description: "Vendor onboarding requests you approve will appear here.",
			};

		default:
			return {
				title: "No vendor onboarding records found",
				description: "Vendor onboarding records will appear here.",
			};
	}
};

export const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;
export const GSTIN_REGEX =
	/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]{1}$/;

export const FORMAT_VALIDATORS: Partial<
	Record<
		keyof VendorCreationFormOneValues,
		(value: string) => string | undefined
	>
> = {
	accountNumber: (value) =>
		ACCOUNT_NUMBER_REGEX.test(value)
			? undefined
			: "Account number must be 9-18 digits.",
	gstin: (value) =>
		GSTIN_REGEX.test(value.toUpperCase())
			? undefined
			: "Enter a valid GSTIN, e.g. 22AAAAA0000A1Z5.",
	pan: (value) =>
		PAN_REGEX.test(value.toUpperCase())
			? undefined
			: "Enter a valid PAN, e.g. AAAAA9999A.",
};
