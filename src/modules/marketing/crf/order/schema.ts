// crf/order/schema.ts
// Validation + defaults for the CRF dispatch-details form.
//
// Rules mirror crfDispatchDetails.service.ts's buildRecipientFields /
// buildAddressFields exactly (same required fields, same email/pincode
// patterns, same "country must be India" rule, same conditional
// recipientUserId / recipientContactId requirement) so a form that passes
// here is never rejected by the backend for a reason the user wasn't
// already shown. The one thing NOT duplicated here is whether a given
// recipientUserId / recipientContactId actually exists — that needs a DB
// lookup the backend already does, and re-checking it here would just be a
// second copy of that logic that can drift from the real one.

import {
	RECIPIENT_TYPES,
	type CrfDispatchFormErrors,
	type CrfDispatchFormField,
	type CrfDispatchFormValues,
	type DispatchDetailsInput,
	type RecipientType,
} from "./types";

export const PINCODE_PATTERN = /^\d{6}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DISPATCH_MESSAGES = {
	recipientTypeInvalid: `recipientType must be one of: ${RECIPIENT_TYPES.join(", ")}`,
	recipientNameRequired: "Enter the recipient's name.",
	recipientNameTooLong: "Name must be at most 255 characters.",
	recipientPhoneRequired: "Enter the recipient's phone number.",
	recipientEmailRequired: "Enter the recipient's email address.",
	recipientEmailInvalid: "Enter a valid email address.",
	recipientUserIdRequired: "Select the employee receiving this.",
	recipientContactIdRequired: "Select the dealer contact receiving this.",
	line1Required: "Enter the house / building and street.",
	cityRequired: "Enter the city.",
	stateRequired: "Enter the state.",
	pincodeRequired: "Enter the PIN code.",
	pincodeInvalid: "PIN code must be exactly 6 digits.",
	countryInvalid: "Only India is supported for delivery.",
} as const;

const trimmed = (value: string) => value.trim();

export type DispatchValidation =
	| { success: true; data: DispatchDetailsInput; errors: CrfDispatchFormErrors }
	| { success: false; data: null; errors: CrfDispatchFormErrors };

/**
 * Validates the flat form values and, on success, returns the nested
 * DispatchDetailsInput body ready to PUT. Errors are keyed the same way the
 * form reads them (flat field names), not the nested wire path.
 */
export const validateDispatchForm = (values: CrfDispatchFormValues): DispatchValidation => {
	const errors: CrfDispatchFormErrors = {};
	const issue = (field: CrfDispatchFormField, message: string) => {
		errors[field] ??= message;
	};

	if (!(RECIPIENT_TYPES as readonly string[]).includes(values.recipientType)) {
		issue("recipientType", DISPATCH_MESSAGES.recipientTypeInvalid);
	}

	const name = trimmed(values.recipientName);
	if (!name) issue("recipientName", DISPATCH_MESSAGES.recipientNameRequired);
	else if (name.length > 255) issue("recipientName", DISPATCH_MESSAGES.recipientNameTooLong);

	if (!trimmed(values.recipientPhone)) {
		issue("recipientPhone", DISPATCH_MESSAGES.recipientPhoneRequired);
	}

	const email = trimmed(values.recipientEmail).toLowerCase();
	if (!email) issue("recipientEmail", DISPATCH_MESSAGES.recipientEmailRequired);
	else if (!EMAIL_PATTERN.test(email) || email.length > 255) {
		issue("recipientEmail", DISPATCH_MESSAGES.recipientEmailInvalid);
	}

	if (values.recipientType === "EMPLOYEE" && !trimmed(values.recipientUserId)) {
		issue("recipientUserId", DISPATCH_MESSAGES.recipientUserIdRequired);
	}
	if (values.recipientType === "DEALER_CONTACT" && !trimmed(values.recipientContactId)) {
		issue("recipientContactId", DISPATCH_MESSAGES.recipientContactIdRequired);
	}

	if (!trimmed(values.line1)) issue("line1", DISPATCH_MESSAGES.line1Required);
	if (!trimmed(values.city)) issue("city", DISPATCH_MESSAGES.cityRequired);
	if (!trimmed(values.state)) issue("state", DISPATCH_MESSAGES.stateRequired);

	const pincode = trimmed(values.pincode);
	if (!pincode) issue("pincode", DISPATCH_MESSAGES.pincodeRequired);
	else if (!PINCODE_PATTERN.test(pincode)) issue("pincode", DISPATCH_MESSAGES.pincodeInvalid);

	const country = trimmed(values.country) || "India";
	if (country.toLowerCase() !== "india") issue("country", DISPATCH_MESSAGES.countryInvalid);

	if (Object.keys(errors).length > 0) return { success: false, data: null, errors };

	const data: DispatchDetailsInput = {
		recipientType: values.recipientType as RecipientType,
		recipientName: name,
		recipientPhone: trimmed(values.recipientPhone),
		recipientEmail: email,
		recipientOrganisation: trimmed(values.recipientOrganisation) || undefined,
		recipientUserId:
			values.recipientType === "EMPLOYEE" ? trimmed(values.recipientUserId) : undefined,
		recipientContactId:
			values.recipientType === "DEALER_CONTACT" ? trimmed(values.recipientContactId) : undefined,
		deliveryInstructions: trimmed(values.deliveryInstructions) || undefined,
		requiredByDate: trimmed(values.requiredByDate) || undefined,
		address: {
			line1: trimmed(values.line1),
			line2: trimmed(values.line2) || undefined,
			landmark: trimmed(values.landmark) || undefined,
			city: trimmed(values.city),
			district: trimmed(values.district) || undefined,
			state: trimmed(values.state),
			pincode,
			country,
			company: trimmed(values.company) || undefined,
			gstin: trimmed(values.gstin).toUpperCase() || undefined,
		},
	};

	return { success: true, data, errors: {} };
};

export const getDefaultDispatchFormValues = (seed?: {
	name?: string | null;
	email?: string | null;
	phone?: string | null;
}): CrfDispatchFormValues => ({
	recipientType: "SELF",
	recipientName: seed?.name ?? "",
	recipientPhone: seed?.phone ?? "",
	recipientEmail: seed?.email ?? "",
	recipientOrganisation: "",
	recipientUserId: "",
	recipientContactId: "",
	deliveryInstructions: "",
	requiredByDate: "",

	line1: "",
	line2: "",
	landmark: "",
	city: "",
	district: "",
	state: "",
	pincode: "",
	country: "India",
	company: "",
	gstin: "",
});
