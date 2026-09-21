import { z } from "zod";

import { vendorContent } from "../../../content/vendor.content";

const errors = vendorContent.vendorCodeModal.errors;

/** Backs the single-field VendorCodeRequiredModal (final-approver gate). */
export const vendorCodeModalSchema = z.object({
	code: z.string().trim().min(1, errors.required),
});

export type VendorCodeModalValues = z.infer<typeof vendorCodeModalSchema>;
