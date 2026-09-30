import { z } from "zod";

import { vendorContent } from "../../../content/vendor.content";
import { EMAIL_REGEX, MOBILE_REGEX } from "../../../utils/form.validation";

const errors = vendorContent.initiation.errors;

/**
 * The vendor initiation form previously had NO client-side validation at
 * all — VendorOnboardingInitiationForm.tsx marked fields `required` at
 * the HTML level only, and useVendorOnboardingInitiation's handleSubmit
 * called the mutation directly with whatever was in state. This schema
 * is net-new validation, not a preservation of prior behavior.
 */
export const vendorInitiationSchema = z.object({
	vendorReferenceName: z.string().trim().min(1, errors.vendorReferenceName),
	email: z
		.string()
		.trim()
		.min(1, errors.email)
		.regex(EMAIL_REGEX, errors.email),
	mobile: z.string().trim().regex(MOBILE_REGEX, errors.mobile),
	// Server-driven display status ("Pending" / "AWAITING_VENDOR" / ...),
	// never entered by the user — no validation rule needed.
	status: z.string().optional(),
});

export type VendorInitiationFormValues = z.infer<typeof vendorInitiationSchema>;
