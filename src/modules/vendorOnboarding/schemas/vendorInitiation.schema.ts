import { z } from "zod";

import { vendorContent } from "../utils/vendor.content";
import { EMAIL_REGEX, MOBILE_REGEX } from "../../../utils/form.validation";

const errors = vendorContent.initiation.errors;

export const vendorInitiationSchema = z.object({
	vendorReferenceName: z.string().trim().min(1, errors.vendorReferenceName),
	email: z
		.string()
		.trim()
		.min(1, errors.email)
		.regex(EMAIL_REGEX, errors.email),
	// Country code is its own field; `mobile` stays the national number so
	// MOBILE_REGEX keeps validating exactly what it did before.
	countryCode: z.string().regex(/^\+\d{1,4}$/, errors.mobile),
	mobile: z.string().trim().regex(MOBILE_REGEX, errors.mobile),
	// Server-driven display status, never entered by the user.
	status: z.string().optional(),
});

export type VendorInitiationFormValues = z.infer<typeof vendorInitiationSchema>;
