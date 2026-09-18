import {
	required,
	email,
	mobileNumber,
	strongPassword,
	minLength,
	type Validator,
} from "./validation.rules";

export type ValidationType = "required" | "email" | "phone";

export type ValidationRule = {
	type: ValidationType;
	message?: string;
};

export type ValidationRules = ValidationRule[];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

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

			return INDIAN_MOBILE_REGEX.test(normalizedValue)
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
