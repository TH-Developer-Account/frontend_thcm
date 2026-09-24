import { VENDOR_DOCUMENT_FIELDS } from "../types/vendorOnboarding.types";
import type {
	VendorCreationFormOneValues,
	VendorOnboardingStatus,
} from "../types/vendorOnboarding.types";
import type { VendorCreationFormOneSubmission } from "./vendor.onboarding.mapper";

// Vendor-workflow rules only. Format patterns and GSTIN/PAN/account-number
// helpers live in utils/validation/form.validation.ts (shared with BP etc.).

export const EDITABLE_STATUSES: readonly VendorOnboardingStatus[] = [
	"DRAFT",
	"VENDOR_SUBMITTED",
	"IN_REVIEW",
	// "AWAITING_VENDOR",
];

// ─────────────────────────────────────────────────────────────────────────────
// Missing-document check (public vendor submission)
// ─────────────────────────────────────────────────────────────────────────────

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
