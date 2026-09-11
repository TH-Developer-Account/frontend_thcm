import { z } from "zod";

import type { BusinessPartnerFormState } from "./bp.types";

/**
 * Single source of truth for BP create/edit validation — replaces the
 * hand-rolled isFormValid boolean in useBusinessPartnerCreateEditForm,
 * same pattern as user-management.schema.ts for the users module.
 *
 * Required-field list here is sourced from what BPOrganizationForm/
 * BPGenInfo.tsx already mark `required` on FormInput/SelectInput, plus the
 * conditional parentId rule from the old isFormValid — not invented fresh.
 */

const requiredString = (label: string) =>
	z.string().trim().min(1, `${label} is required.`);

const optionalString = z.string().optional().default("");

export const officeTypeEnum = z.enum(["HEAD_OFFICE", "BRANCH_OFFICE"]);
export const bpTypeEnum = z.enum(["DEALER", "CUSTOMER", "EMPLOYEE"]);
export const entityTypeEnum = z.enum([
	"COMPANY",
	"PARTNERSHIP",
	"PROPRIETORSHIP",
	"INDIVIDUAL",
	"OTHER",
]);

export const businessPartnerFormSchema = z
	.object({
		internalId: optionalString,
		vendorId: optionalString,
		bpId: optionalString,
		s4Id: optionalString,
		bydId: optionalString,
		c4cId: optionalString,

		bpName: requiredString("Business Partner Name"),
		bpShortName: optionalString,
		legalTradeName: optionalString,

		gst: optionalString,
		panNumber: optionalString,
		vendorCode: optionalString,

		// z.enum requires a non-empty value, but the form's initial/empty
		// state is `""` (see BusinessPartnerFormState) — union with the
		// literal empty string so the schema accepts the unset state without
		// weakening the eventual required check below.
		officeType: z.union([officeTypeEnum, z.literal("")]),
		bpType: z.union([bpTypeEnum, z.literal("")]),
		entityType: z.union([entityTypeEnum, z.literal("")]).optional(),

		isKeyAccount: z.boolean().default(false),
		isActive: z.boolean().default(true),

		joinedOn: optionalString,
		parentId: optionalString,

		mobileNumber: optionalString,
		email: optionalString,
		fax: optionalString,
		telephone: optionalString,
	})
	.superRefine((values, ctx) => {
		if (!values.officeType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["officeType"],
				message: "Office Type is required.",
			});
		}

		if (!values.bpType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["bpType"],
				message: "Business Partner Type is required.",
			});
		}

		// Cross-field: parentId is only required once officeType resolves to
		// BRANCH_OFFICE — mirrors the old isFormValid's
		// `form.officeType !== "BRANCH_OFFICE" || form.parentId.trim()` check,
		// now surfaced as a field-level error instead of a silent boolean.
		if (values.officeType === "BRANCH_OFFICE" && !values.parentId.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["parentId"],
				message: "Parent Business Partner ID is required for a branch office.",
			});
		}

		if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["email"],
				message: "Enter a valid email address.",
			});
		}
	});

export type BusinessPartnerFieldErrors = Partial<
	Record<keyof BusinessPartnerFormState, string>
>;

/**
 * Validates a BusinessPartnerFormState and returns a flat
 * `{ field: message }` map — same shape convention as validateUserForm in
 * user-management.utils.ts, so any shared error-banner component works
 * against both modules without a translation layer.
 */
export const validateBusinessPartnerForm = (
	values: BusinessPartnerFormState,
): BusinessPartnerFieldErrors => {
	const result = businessPartnerFormSchema.safeParse(values);
	if (result.success) return {};

	const fieldErrors: BusinessPartnerFieldErrors = {};
	result.error.issues.forEach((issue) => {
		const field = issue.path[0] as keyof BusinessPartnerFormState | undefined;
		if (!field || fieldErrors[field]) return; // first issue per field only
		fieldErrors[field] = issue.message;
	});

	return fieldErrors;
};
