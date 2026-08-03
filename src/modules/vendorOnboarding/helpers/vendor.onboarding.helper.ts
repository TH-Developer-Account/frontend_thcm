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
	address: toNullableString(values.completeAddress),
	mobile: toNullableString(values.mobile),
	email: toNullableString(values.email),
	msmeVendor: toNullableBoolean(values.msmeVendor),
	msmeCertAttached: toNullableBoolean(values.msmeCertificateAttached),
	bankName: toNullableString(values.bank),
	bankBranch: toNullableString(values.branch),
	ifscCode: toNullableString(values.ifscCode),
	bankAddress: toNullableString(values.bankAddress),
	accountNumber: toNullableString(values.accountNumber),
	gstin: toNullableString(values.gstin),
	pan: toNullableString(values.pan),
	entityRegNo: toNullableString(values.entityRegistrationNumber),
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

	const hasDocument = (type: string) =>
		documents.some((document) => document.documentType === type) ? "Yes" : "No";

	return {
		id: raw.id,
		status: raw.status,
		partOne: {
			vendorName: raw.vendorName ?? "",
			completeAddress: raw.address ?? "",
			msmeVendor: toYesNo(raw.msmeVendor),
			msmeCertificateAttached: toYesNo(raw.msmeCertAttached),
			city: raw.city ?? "",
			pinCode: raw.pinCode ?? "",
			state: raw.state ?? "",
			mobile: raw.mobile ?? "",
			email: raw.email ?? "",
			bank: raw.bankName ?? "",
			branch: raw.bankBranch ?? "",
			ifscCode: raw.ifscCode ?? "",
			bankAddress: raw.bankAddress ?? "",
			accountNumber: raw.accountNumber ?? "",
			gstin: raw.gstin ?? "",
			pan: raw.pan ?? "",
			entityRegistrationNumber: raw.entityRegNo ?? "",
			gstCertificate: hasDocument("GST_CERTIFICATE"),
			panNumber: hasDocument("PAN_DOCUMENT"),
			bankCancelledCheque: hasDocument("CANCELLED_CHEQUE"),
			certificateOfIncorporation: hasDocument("INCORPORATION_CERTIFICATE"),
			msmeCertificate: hasDocument("MSME_CERTIFICATE"),
			ndaCertificate: hasDocument("NDA_CERTIFICATE"),
			ndaObtained: hasDocument("NDA_CERTIFICATE")
				? toYesNo(true)
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
): VendorDocumentType[] =>
	VENDOR_DOCUMENT_FIELDS.filter((field) => field.required)
		.filter(
			(field) =>
				!submission.enclosureUploads.some(
					(item) =>
						item.documentType === field.documentType &&
						item.value?.file instanceof File,
				),
		)
		.map((field) => field.documentType);

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
