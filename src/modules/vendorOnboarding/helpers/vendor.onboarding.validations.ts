import { VENDOR_DOCUMENT_FIELDS } from "../types/vendorOnboarding.types";
import type {
	VendorCreationFormOneValues,
	VendorCreationFormTwoValues,
	VendorFormErrors,
	VendorOnboardingStatus,
} from "../types/vendorOnboarding.types";
import type { VendorCreationFormOneSubmission } from "./vendor.onboarding.mapper";

export const MANDATORY_ERROR = "Mandatory";

export const EDITABLE_STATUSES: readonly VendorOnboardingStatus[] = [
	"DRAFT",
	"VENDOR_SUBMITTED",
	"IN_REVIEW",
];

export const NON_MANDATORY_FIELDS = new Set<keyof VendorCreationFormTwoValues>([
	"vendorCode",
]);

// ─────────────────────────────────────────────────────────────────────────────
// normalizeMandatoryErrors
// ─────────────────────────────────────────────────────────────────────────────
// Collapses any "required"/"missing" style validation message down to the
// single canonical MANDATORY_ERROR label used across the vendor forms.

export const normalizeMandatoryErrors = (
	errors: VendorFormErrors<VendorCreationFormOneValues>,
): VendorFormErrors<VendorCreationFormOneValues> =>
	Object.fromEntries(
		Object.entries(errors).map(([key, value]) => [
			key,
			typeof value === "string" && /required|missing/i.test(value)
				? MANDATORY_ERROR
				: value,
		]),
	) as VendorFormErrors<VendorCreationFormOneValues>;

// ─────────────────────────────────────────────────────────────────────────────
// validateMandatoryValues
// ─────────────────────────────────────────────────────────────────────────────
// Flags any field in form-two (aside from NON_MANDATORY_FIELDS) that is
// empty/undefined/blank/an empty array.

export const validateMandatoryValues = (
	values: VendorCreationFormTwoValues,
): VendorFormErrors<VendorCreationFormTwoValues> =>
	Object.fromEntries(
		Object.entries(values).flatMap(([key, value]) => {
			const field = key as keyof VendorCreationFormTwoValues;

			if (NON_MANDATORY_FIELDS.has(field)) {
				return [];
			}

			const isMissing =
				value === null ||
				value === undefined ||
				(typeof value === "string" && value.trim() === "") ||
				(Array.isArray(value) && value.length === 0);

			return isMissing ? [[field, MANDATORY_ERROR]] : [];
		}),
	) as VendorFormErrors<VendorCreationFormTwoValues>;

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
// Format validators (regex-backed field checks)
// ─────────────────────────────────────────────────────────────────────────────

export const ACCOUNT_NUMBER_REGEX = /^[A-Za-z0-9]{9,34}$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
export const GSTIN_REGEX =
	/^(?:0[1-9]|[12]\d|3[0-8])[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
// 6-digit Indian PIN code; first digit can't be 0.
export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
// 10-digit Indian mobile number; must start 6-9.
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 4 letters (bank code) + literal 0 + 6 alphanumeric (branch code).
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const FORMAT_VALIDATORS: Partial<
	Record<
		keyof VendorCreationFormOneValues,
		(value: string) => string | undefined
	>
> = {
	accountNumber: (value) =>
		ACCOUNT_NUMBER_REGEX.test(value.toUpperCase())
			? undefined
			: "Account number must be 9-34 alphanumeric characters.",
	gstin: (value) =>
		GSTIN_REGEX.test(value.toUpperCase())
			? undefined
			: "Enter a valid GSTIN, e.g. 22AAAAA0000A1Z5.",
	pan: (value) =>
		PAN_REGEX.test(value.toUpperCase())
			? undefined
			: "Enter a valid PAN, e.g. AAAAA9999A.",
	pinCode: (value) =>
		PIN_CODE_REGEX.test(value) ? undefined : "Enter a valid 6-digit Pin Code.",
	mobile: (value) =>
		MOBILE_REGEX.test(value)
			? undefined
			: "Enter a valid 10-digit mobile number.",
	email: (value) =>
		EMAIL_REGEX.test(value) ? undefined : "Enter a valid e-mail address.",
	ifscCode: (value) =>
		IFSC_REGEX.test(value.toUpperCase())
			? undefined
			: "Enter a valid IFSC code, e.g. HDFC0001234.",
};

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

// ─────────────────────────────────────────────────────────────────────────────
// GSTIN → PAN extraction & cross-validation
// ─────────────────────────────────────────────────────────────────────────────
// A GSTIN embeds the holder's PAN at characters 3-12 (1-indexed): 2-digit
// state code, then the 10-character PAN, then 3 more GSTIN-specific chars.

// Pulls the PAN out of a GSTIN once enough of it has been typed to trust the
// PAN segment. Returns null while the GSTIN is too short or that segment
// isn't itself a well-formed PAN yet (still mid-typing, or invalid).
export const extractPanFromGstin = (gstin: string): string | null => {
	const normalized = gstin.trim().toUpperCase();
	if (normalized.length < 12) return null;

	const candidatePan = normalized.slice(2, 12);
	return PAN_REGEX.test(candidatePan) ? candidatePan : null;
};

// Validates PAN's format, then — if a well-formed GSTIN is present — that it
// matches the PAN embedded in that GSTIN. Does not check required-ness.
export const validatePanField = (
	values: Pick<VendorCreationFormOneValues, "gstin" | "pan">,
): string | undefined => {
	const pan = values.pan?.trim().toUpperCase() ?? "";
	if (!pan) return undefined;

	const formatError = FORMAT_VALIDATORS.pan?.(pan);
	if (formatError) return formatError;

	const gstin = values.gstin?.trim().toUpperCase() ?? "";
	if (!GSTIN_REGEX.test(gstin)) return undefined; // nothing to cross-check yet

	return getGstinPanMatchStatus(gstin, pan) === "mismatch"
		? "PAN does not match the PAN embedded in the GSTIN."
		: undefined;
};

// Full PAN check (required + format + GSTIN match) — the single source of
// truth used both on every keystroke and at submit time.
export const validatePanForForm = (
	values: Pick<VendorCreationFormOneValues, "gstin" | "pan">,
): string | undefined => {
	if (isEmptyFormValue(values.pan)) {
		return REQUIRED_FORM_ONE_FIELDS.pan;
	}
	return validatePanField(values);
};

// ─────────────────────────────────────────────────────────────────────────────
// Form-one required fields + per-field / submit-time validation
// ─────────────────────────────────────────────────────────────────────────────

// Every field the vendor actually types or picks on Form One is mandatory.
// (The document-status fields — gstCertificate, panNumber, msmeCertificate,
// etc. — are derived from uploads and enforced separately via
// isEnclosureRequired/getMissingDocuments, not here.)
export const REQUIRED_FORM_ONE_FIELDS: Partial<
	Record<keyof VendorCreationFormOneValues, string>
> = {
	vendorName: "Vendor Name is required.",
	state: "State is required.",
	city: "City is required.",
	pinCode: "Pin Code is required.",
	address: "Complete Address is required.",
	mobile: "Mobile is required.",
	email: "E-mail is required.",
	bankName: "Bank is required.",
	bankBranch: "Branch is required.",
	ifscCode: "IFSC Code is required.",
	accountNumber: "A/C No. is required.",
	confirmAccountNumber: "Confirm A/C No. is required.",
	gstin: "GSTIN is required.",
	pan: "PAN is required.",
	entityRegNo: "Entity Registration No. is required.",
	msmeVendor: "MSME Vendor is required.",
	ndaObtained: "NDA Obtained is required.",
	bankAddress: "Mandatory*",
};

export const isEmptyFormValue = (value: unknown): boolean =>
	typeof value === "string" ? value.trim().length === 0 : value == null;

// Normalizes an account number the same way everywhere it's read.
export const normalizeAccountNumber = (value?: string | null): string =>
	value?.trim().toUpperCase() ?? "";

// Single source of truth for "does confirm need to be shown/checked".
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
	const isAccountNumberChanged = accountNumber !== originalAccountNumber;
	// No original value at all (new record) → always require confirm.
	// Otherwise only require it once the vendor actually edits the number.
	const confirmRequired = !originalAccountNumber || isAccountNumberChanged;

	return {
		accountNumber,
		confirmAccountNumber,
		isAccountNumberChanged,
		confirmRequired,
	};
};

// Validates ONLY confirmAccountNumber, given current values.
export const validateConfirmAccountNumber = (
	values: Pick<
		VendorCreationFormOneValues,
		"accountNumber" | "confirmAccountNumber"
	>,
	originalAccountNumber: string,
): string | undefined => {
	const { accountNumber, confirmAccountNumber, confirmRequired } =
		getAccountNumberConfirmState(values, originalAccountNumber);

	if (!confirmRequired) return undefined;

	if (!confirmAccountNumber) {
		return REQUIRED_FORM_ONE_FIELDS.confirmAccountNumber;
	}
	if (!ACCOUNT_NUMBER_REGEX.test(confirmAccountNumber)) {
		return FORMAT_VALIDATORS.accountNumber?.(confirmAccountNumber);
	}
	if (confirmAccountNumber !== accountNumber) {
		return "Account numbers do not match.";
	}
	return undefined;
};

// Validates ONE field (required + format), used on every keystroke.
export const validateFormOneField = <
	K extends keyof VendorCreationFormOneValues,
>(
	field: K,
	value: VendorCreationFormOneValues[K],
): string | undefined => {
	if (REQUIRED_FORM_ONE_FIELDS[field] && isEmptyFormValue(value)) {
		return REQUIRED_FORM_ONE_FIELDS[field];
	}

	const trimmedValue = typeof value === "string" ? value.trim() : undefined;
	const formatValidator = FORMAT_VALIDATORS[field];

	return formatValidator && trimmedValue
		? formatValidator(trimmedValue)
		: undefined;
};

// Full submit-time gate — checks every required/format field AND
// confirmAccountNumber. Used right before save/submit, not on every keystroke.
export const validateFormOneForSubmit = (
	values: VendorCreationFormOneValues,
	originalAccountNumber: string,
): VendorFormErrors<VendorCreationFormOneValues> => {
	const errors: VendorFormErrors<VendorCreationFormOneValues> = {};

	(
		Object.keys(REQUIRED_FORM_ONE_FIELDS) as Array<
			keyof VendorCreationFormOneValues
		>
	).forEach((field) => {
		if (field === "confirmAccountNumber" || field === "pan") return; // handled separately below
		const error = validateFormOneField(field, values[field]);
		if (error) errors[field] = error;
	});

	const panError = validatePanForForm(values);
	if (panError) errors.pan = panError;

	const confirmError = validateConfirmAccountNumber(
		values,
		originalAccountNumber,
	);
	if (confirmError) errors.confirmAccountNumber = confirmError;

	return errors;
};
