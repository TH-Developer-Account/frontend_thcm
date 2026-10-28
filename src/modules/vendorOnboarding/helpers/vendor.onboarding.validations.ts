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
// Not-applicable (N/A) option
// ─────────────────────────────────────────────────────────────────────────────
// GST, Incorporation and MSME can be marked N/A. When a field is N/A its
// document is not required (and not shown). "Other" attachments never get an
// N/A option. Single source of truth for the literal + the check, so the
// schema, the form controller and getMissingDocuments can't drift apart.

export const NOT_APPLICABLE = "N/A";

export const isNotApplicable = (value?: string | null): boolean =>
	value?.trim().toUpperCase() === NOT_APPLICABLE;

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
		if (field.documentType === "GST_CERTIFICATE") {
			return !isNotApplicable(values.gstApplicability);
		}

		if (field.documentType === "INCORPORATION_CERTIFICATE") {
			return !isNotApplicable(values.incorporationApplicability);
		}

		// Only "Yes" requires the certificate; "No" and "N/A" don't.
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
