import { VENDOR_DOCUMENT_FIELDS } from "../types/vendorOnboarding.types";
import type {
	VendorCreationFormOneValues,
	VendorOnboardingStatus,
} from "../types/vendorOnboarding.types";
import type { VendorCreationFormOneSubmission } from "./vendor.onboarding.mapper";

// ─────────────────────────────────────────────────────────────────────────────
// Domain helpers kept after the RHF + Zod migration
// ─────────────────────────────────────────────────────────────────────────────
// Field-level and submit-level validation (required-ness, format checks,
// GSTIN/PAN cross-check, confirm-account-number) now lives in
// ../schemas/vendorFormOne.schema.ts and ../schemas/vendorFormTwo.schema.ts,
// driven by React Hook Form. What's left here is business-rule logic that
// genuinely doesn't belong in a Zod schema per se:
//
//   - regex constants the schemas import directly (single source of truth
//     for "what does a valid PAN/GSTIN/IFSC/etc. look like")
//   - getGstinPanMatchStatus / extractPanFromGstin — GSTIN embeds the
//     holder's PAN; the schema's superRefine calls the match-status
//     helper, and useVendorCreationForm's onChange handler calls the
//     extraction helper for the live auto-fill-PAN-from-GSTIN side effect
//     (a UX behavior, not a validation rule, so it stays outside Zod)
//   - getAccountNumberConfirmState — whether confirmAccountNumber is
//     required depends on whether the account number changed from what's
//     on file, which the schema doesn't know on its own; the schema's
//     superRefine calls this helper too, per the project convention of
//     keeping workflow/state-dependent business rules as plain functions
//     called from superRefine rather than reimplemented inline
//   - getMissingDocuments / EDITABLE_STATUSES — unrelated to Zod entirely
//     (document-upload state, workflow-status gating)

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

// ─────────────────────────────────────────────────────────────────────────────
// Format regexes — imported directly by the Zod schemas' `.regex()` calls.
// Keeping these here (rather than redefined inline in each schema) means
// the "what's a valid PAN/GSTIN/..." definition has exactly one source.
// ─────────────────────────────────────────────────────────────────────────────

export const ACCOUNT_NUMBER_REGEX = /^[A-Za-z0-9]{9,34}$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
export const GSTIN_REGEX =
	/^(?:0[1-9]|[12]\d|3[0-9])[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// 6-digit Indian PIN code; first digit can't be 0.
export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
// 10-digit Indian mobile number; must start 6-9.
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// 4 letters (bank code) + literal 0 + 6 alphanumeric (branch code).
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ─────────────────────────────────────────────────────────────────────────────
// GSTIN → PAN extraction & cross-validation
// ─────────────────────────────────────────────────────────────────────────────
// A GSTIN embeds the holder's PAN at characters 3-12 (1-indexed): 2-digit
// state code, then the 10-character PAN, then 3 more GSTIN-specific chars.

export const getGstinPanMatchStatus = (
	gstin: string,
	pan: string,
): "valid" | "mismatch" | "incomplete" => {
	const normalizedGstin = gstin.trim().toUpperCase();
	const normalizedPan = pan.trim().toUpperCase();

	if (!GSTIN_REGEX.test(normalizedGstin) || !PAN_REGEX.test(normalizedPan)) {
		return "incomplete";
	}

	return normalizedGstin.slice(2, 12) === normalizedPan ? "valid" : "mismatch";
};

// Pulls the PAN out of a GSTIN once enough of it has been typed to trust the
// PAN segment. Returns null while the GSTIN is too short or that segment
// isn't itself a well-formed PAN yet (still mid-typing, or invalid). This is
// a live-typing UX affordance (auto-fill PAN while typing GSTIN), not a
// validation rule, so it's called from useVendorCreationForm's onChange
// handler rather than from the Zod schema.
export const extractPanFromGstin = (gstin: string): string | null => {
	const normalized = gstin.trim().toUpperCase();
	if (normalized.length < 12) return null;

	const candidatePan = normalized.slice(2, 12);
	return PAN_REGEX.test(candidatePan) ? candidatePan : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Confirm-account-number requiredness
// ─────────────────────────────────────────────────────────────────────────────
// Normalizes an account number the same way everywhere it's read/compared.
export const normalizeAccountNumber = (value?: string | null): string =>
	value?.trim().toUpperCase() ?? "";

// Single source of truth for "does confirm need to be shown/checked" — a
// brand-new record always requires it; an existing one only requires it
// once the vendor actually edits the account number. The Zod schema's
// superRefine calls this (rather than re-deriving the rule) because it
// depends on `originalAccountNumber`, which is server/session state the
// schema doesn't own.
export type AccountNumberConfirmState = {
	accountNumber: string;
	confirmAccountNumber: string;
	isAccountNumberChanged: boolean;
	confirmRequired: boolean;
};

export const getAccountNumberConfirmState = (
	values: Pick<
		VendorCreationFormOneValues,
		"accountNumber" | "confirmAccountNumber"
	>,
	originalAccountNumber: string,
): AccountNumberConfirmState => {
	const accountNumber = normalizeAccountNumber(values.accountNumber);
	const confirmAccountNumber = normalizeAccountNumber(
		values.confirmAccountNumber,
	);
	const normalizedOriginal = normalizeAccountNumber(originalAccountNumber);
	const isAccountNumberChanged = accountNumber !== normalizedOriginal;
	// No original value at all (new record) → always require confirm.
	// Otherwise only require it once the vendor actually edits the number.
	const confirmRequired = !normalizedOriginal || isAccountNumberChanged;

	return {
		accountNumber,
		confirmAccountNumber,
		isAccountNumberChanged,
		confirmRequired,
	};
};
