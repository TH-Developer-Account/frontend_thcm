import {
	required,
	email,
	mobileNumber,
	strongPassword,
	minLength,
	type Validator,
} from "./validation.rules";

// ─────────────────────────────────────────────────────────────────────────────
// Format patterns — single source of truth for the whole app.
// Zod schemas (Vendor Onboarding, Business Partners, …) import these directly
// in their .regex()/.refine() calls instead of redefining them.
// ─────────────────────────────────────────────────────────────────────────────

/** 10-digit Indian mobile number; must start 6–9. */
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

/** 6-digit Indian PIN code; first digit can't be 0. */
export const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;

/** PAN: 5 letters, 4 digits, 1 letter. Test against an uppercased value. */
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;

/** GSTIN: 2-digit state code (01–39) + PAN + entity code + "Z" + checksum char. */
export const GSTIN_REGEX =
	/^(?:0[1-9]|[12]\d|3[0-9])[A-Z]{5}\d{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/;

/** IFSC: 4 letters (bank code) + literal 0 + 6 alphanumeric (branch code). */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Bank account number: 9–34 alphanumeric characters. */
export const ACCOUNT_NUMBER_REGEX = /^[A-Za-z0-9]{9,34}$/;

/** General email rule used by the common validators below. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Stricter email rule (restricted character set) used by Vendor Onboarding.
 * Kept separate so neither module's behaviour changes; converge with
 * EMAIL_REGEX in a dedicated, disclosed change.
 */
export const EMAIL_STRICT_REGEX =
	/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─────────────────────────────────────────────────────────────────────────────
// GSTIN → PAN
// A GSTIN embeds the holder's PAN at characters 3–12 (1-indexed).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * "incomplete" unless both values are individually well-formed, so callers
 * can use it in superRefine without stacking on top of format errors.
 */
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

/**
 * Pulls the PAN out of a partially typed GSTIN once the PAN segment is
 * itself well-formed. A live-typing UX helper (auto-fill), not a validation
 * rule — call it from onChange handlers, not from schemas.
 */
export const extractPanFromGstin = (gstin: string): string | null => {
	const normalized = gstin.trim().toUpperCase();
	if (normalized.length < 12) return null;

	const candidatePan = normalized.slice(2, 12);
	return PAN_REGEX.test(candidatePan) ? candidatePan : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Bank account number confirmation
// ─────────────────────────────────────────────────────────────────────────────

export const normalizeAccountNumber = (value?: string | null): string =>
	value?.trim().toUpperCase() ?? "";

export type AccountNumberConfirmState = {
	accountNumber: string;
	confirmAccountNumber: string;
	isAccountNumberChanged: boolean;
	confirmRequired: boolean;
};

type AccountNumberConfirmInput = {
	accountNumber?: string | null;
	confirmAccountNumber?: string | null;
};

/**
 * Whether confirmAccountNumber must be shown/checked. A brand-new record
 * (no original value) always requires it; an existing one only once the
 * number actually changes. Schemas call this from superRefine because it
 * depends on the saved value, which the schema doesn't own.
 */
export const getAccountNumberConfirmState = (
	values: AccountNumberConfirmInput,
	originalAccountNumber: string,
): AccountNumberConfirmState => {
	const accountNumber = normalizeAccountNumber(values.accountNumber);
	const confirmAccountNumber = normalizeAccountNumber(
		values.confirmAccountNumber,
	);
	const normalizedOriginal = normalizeAccountNumber(originalAccountNumber);
	const isAccountNumberChanged = accountNumber !== normalizedOriginal;
	const confirmRequired = !normalizedOriginal || isAccountNumberChanged;

	return {
		accountNumber,
		confirmAccountNumber,
		isAccountNumberChanged,
		confirmRequired,
	};
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy rule-based validators (non-RHF forms). Unchanged behaviour; they
// now read the shared patterns above.
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationType = "required" | "email" | "phone";

export type ValidationRule = {
	type: ValidationType;
	message?: string;
};

export type ValidationRules = ValidationRule[];

const DEFAULT_MESSAGES: Record<ValidationType, string> = {
	required: "This field is required.",
	email: "Enter a valid email address.",
	phone: "Enter a valid 10-digit mobile number.",
};

const validateRule = (value: string, rule: ValidationRule): string => {
	const normalizedValue = value.trim();

	switch (rule.type) {
		case "required":
			return normalizedValue ? "" : (rule.message ?? DEFAULT_MESSAGES.required);

		case "email":
			if (!normalizedValue) return "";

			return EMAIL_REGEX.test(normalizedValue)
				? ""
				: (rule.message ?? DEFAULT_MESSAGES.email);

		case "phone":
			if (!normalizedValue) return "";

			return MOBILE_REGEX.test(normalizedValue)
				? ""
				: (rule.message ?? DEFAULT_MESSAGES.phone);

		default:
			return "";
	}
};

export const validateFormValue = (
	value: unknown,
	rules: ValidationRules = [],
): string => {
	const stringValue = String(value ?? "");

	for (const rule of rules) {
		const error = validateRule(stringValue, rule);

		if (error) return error;
	}

	return "";
};

export const FORM_VALIDATIONS = {
	email: [{ type: "required" }, { type: "email" }],
	phone: [{ type: "required" }, { type: "phone" }],
} satisfies Record<string, ValidationRules>;

export const composeValidators =
	(...validators: Validator[]): Validator =>
	(value) => {
		for (const validate of validators) {
			const error = validate(value);
			if (error) return error;
		}
		return null;
	};

export const emailField = composeValidators(required(), email());
export const mobileField = composeValidators(required(), mobileNumber());
export const passwordField = composeValidators(required(), strongPassword());
export const nameField = composeValidators(required(), minLength(2));
