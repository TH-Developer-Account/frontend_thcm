// crf/crf.order.schema.ts
// Validation + defaults for the CRF order (shipping / recipient / billing)
// form. Rules mirror THCM Create Order: India only, 6-digit PIN that exists,
// state = the PIN's state, city = a city of that PIN.

import { z } from "zod";

import type {
	CrfOrderContext,
	CrfOrderFormErrors,
	CrfOrderFormField,
	CrfOrderFormValues,
	DeliveryEstimate,
} from "./crf.order.types";

export const PINCODE_PATTERN = /^[1-9]\d{5}$/;
/** Indian mobile: 10 digits starting 6–9 (an optional +91 / 0 is stripped). */
export const MOBILE_PATTERN = /^[6-9]\d{9}$/;
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const ORDER_MESSAGES = {
	pincodeRequired: "Enter the delivery PIN code.",
	pincodeInvalid: "Enter a valid 6-digit PIN code.",
	pincodeNotChecked: "Check delivery for this PIN code first.",
	pincodeNotServiceable: "The store doesn't deliver to this PIN code.",
	cityRequired: "Select the city.",
	cityMismatch: "This city doesn't match the PIN code.",
	stateRequired: "State is required.",
	address1Required: "Enter the house / building and street.",
	address1Short: "Address is too short.",
	nameRequired: "Enter the recipient's name.",
	nameShort: "Name is too short.",
	mobileRequired: "Enter the recipient's mobile number.",
	mobileInvalid: "Enter a valid 10-digit mobile number.",
	emailInvalid: "Enter a valid email address.",
	gstinInvalid: "Enter a valid 15-character GSTIN.",
	billingNameRequired: "Enter the billing name.",
	billingAddressRequired: "Enter the billing address.",
	billingCityRequired: "Enter the billing city.",
	billingStateRequired: "Enter the billing state.",
	tooLong: (max: number) => `Keep this under ${max} characters.`,
} as const;

/** "+91 98765-43210" → "9876543210". */
export const normalizeMobile = (value: string) => {
	const digits = value.replace(/\D/g, "");
	if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
	if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
	return digits;
};

const sameCity = (a: string, b: string) =>
	a.trim().toLowerCase().replace(/[^a-z]/g, "") === b.trim().toLowerCase().replace(/[^a-z]/g, "");

const text = (max: number) => z.string().max(max, ORDER_MESSAGES.tooLong(max));

/* ========================================================================== */
/*                                   Schema                                   */
/* ========================================================================== */

export const createCrfOrderFormSchema = (estimate: DeliveryEstimate | null) =>
	z
		.object({
			pincode: z.string().trim().min(1, ORDER_MESSAGES.pincodeRequired).regex(PINCODE_PATTERN, ORDER_MESSAGES.pincodeInvalid),
			city: text(100).trim().min(1, ORDER_MESSAGES.cityRequired),
			state: text(100).trim().min(1, ORDER_MESSAGES.stateRequired),
			address1: text(200).trim().min(1, ORDER_MESSAGES.address1Required).min(5, ORDER_MESSAGES.address1Short),
			address2: text(200),
			landmark: text(100),
			company: text(120),

			recipientName: text(100).trim().min(1, ORDER_MESSAGES.nameRequired).min(2, ORDER_MESSAGES.nameShort),
			recipientPhone: z
				.string()
				.transform(normalizeMobile)
				.pipe(z.string().min(1, ORDER_MESSAGES.mobileRequired).regex(MOBILE_PATTERN, ORDER_MESSAGES.mobileInvalid)),
			recipientEmail: z
				.string()
				.trim()
				.refine((v) => v === "" || z.string().email().safeParse(v).success, ORDER_MESSAGES.emailInvalid),
			alternatePhone: z
				.string()
				.transform(normalizeMobile)
				.refine((v) => v === "" || MOBILE_PATTERN.test(v), ORDER_MESSAGES.mobileInvalid),
			deliveryInstructions: text(300),

			billingSameAsShipping: z.boolean(),
			billingName: text(100),
			billingCompany: text(120),
			billingGstin: z.string().trim().toUpperCase(),
			billingAddress1: text(200),
			billingCity: text(100),
			billingState: text(100),
			billingPincode: z.string().trim(),
		})
		.superRefine((values, ctx) => {
			const issue = (path: CrfOrderFormField, message: string) =>
				ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

			// The delivery check must be for THIS PIN, and serviceable.
			if (PINCODE_PATTERN.test(values.pincode)) {
				if (!estimate || estimate.pincode !== values.pincode) {
					issue("pincode", ORDER_MESSAGES.pincodeNotChecked);
				} else if (!estimate.serviceable) {
					issue("pincode", estimate.message || ORDER_MESSAGES.pincodeNotServiceable);
				} else if (
					values.city &&
					estimate.cities.length > 0 &&
					!estimate.cities.some((c) => sameCity(c, values.city))
				) {
					issue("city", ORDER_MESSAGES.cityMismatch);
				}
			}

			if (values.billingGstin && !GSTIN_PATTERN.test(values.billingGstin)) {
				issue("billingGstin", ORDER_MESSAGES.gstinInvalid);
			}

			if (values.billingSameAsShipping) return;

			if (!values.billingName.trim()) issue("billingName", ORDER_MESSAGES.billingNameRequired);
			if (!values.billingAddress1.trim()) issue("billingAddress1", ORDER_MESSAGES.billingAddressRequired);
			if (!values.billingCity.trim()) issue("billingCity", ORDER_MESSAGES.billingCityRequired);
			if (!values.billingState.trim()) issue("billingState", ORDER_MESSAGES.billingStateRequired);
			if (!PINCODE_PATTERN.test(values.billingPincode)) issue("billingPincode", ORDER_MESSAGES.pincodeInvalid);
		});

export type CrfOrderValidation =
	| { success: true; data: CrfOrderFormValues; errors: CrfOrderFormErrors }
	| { success: false; data: null; errors: CrfOrderFormErrors };

export const validateCrfOrderForm = (
	values: CrfOrderFormValues,
	estimate: DeliveryEstimate | null,
): CrfOrderValidation => {
	const result = createCrfOrderFormSchema(estimate).safeParse(values);
	if (result.success) return { success: true, data: result.data, errors: {} };

	const errors: CrfOrderFormErrors = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as CrfOrderFormField | undefined;
		if (field && !errors[field]) errors[field] = issue.message;
	}
	return { success: false, data: null, errors };
};

/* ========================================================================== */
/*                                  Defaults                                  */
/* ========================================================================== */

export const getDefaultOrderFormValues = (context: CrfOrderContext): CrfOrderFormValues => ({
	pincode: context.defaultPincode && PINCODE_PATTERN.test(context.defaultPincode) ? context.defaultPincode : "",
	city: "",
	state: "",
	address1: "",
	address2: "",
	landmark: "",
	company: "",

	// Requester is the usual recipient — editable.
	recipientName: context.requester.name,
	recipientPhone: context.requester.phone ?? "",
	recipientEmail: context.requester.email,
	alternatePhone: "",
	deliveryInstructions: "",

	billingSameAsShipping: true,
	billingName: "",
	billingCompany: "",
	billingGstin: "",
	billingAddress1: "",
	billingCity: "",
	billingState: "",
	billingPincode: "",
});

/** Fields shown in each block — used to scroll / focus the first error. */
export const ORDER_FIELD_ORDER: CrfOrderFormField[] = [
	"pincode",
	"city",
	"state",
	"address1",
	"address2",
	"landmark",
	"company",
	"recipientName",
	"recipientPhone",
	"recipientEmail",
	"alternatePhone",
	"deliveryInstructions",
	"billingName",
	"billingCompany",
	"billingGstin",
	"billingAddress1",
	"billingCity",
	"billingState",
	"billingPincode",
];
