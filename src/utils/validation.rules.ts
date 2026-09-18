export type Validator = (value: unknown) => string | null;

export const required =
	(message = "This field is required"): Validator =>
	(value) => {
		if (value === null || value === undefined) return message;
		if (typeof value === "string" && !value.trim()) return message;
		if (Array.isArray(value) && value.length === 0) return message;
		return null;
	};

export const email =
	(message = "Enter a valid email address"): Validator =>
	(value) => {
		if (!value) return null; // let `required` handle emptiness
		const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return pattern.test(String(value)) ? null : message;
	};

export const mobileNumber =
	(message = "Enter a valid 10-digit mobile number"): Validator =>
	(value) => {
		if (!value) return null;
		return /^[6-9]\d{9}$/.test(String(value)) ? null : message;
	};

export const strongPassword =
	(message = "Min 8 chars, 1 uppercase, 1 number, 1 symbol"): Validator =>
	(value) => {
		if (!value) return null;
		const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
		return pattern.test(String(value)) ? null : message;
	};

export const minLength =
	(min: number, message = `Minimum ${min} characters`): Validator =>
	(value) =>
		!value || String(value).length >= min ? null : message;

export const maxLength =
	(max: number, message = `Maximum ${max} characters`): Validator =>
	(value) =>
		!value || String(value).length <= max ? null : message;

export const pattern =
	(regex: RegExp, message: string): Validator =>
	(value) =>
		!value || regex.test(String(value)) ? null : message;

export const matches =
	(getOtherValue: () => unknown, message = "Values do not match"): Validator =>
	(value) =>
		value === getOtherValue() ? null : message;
