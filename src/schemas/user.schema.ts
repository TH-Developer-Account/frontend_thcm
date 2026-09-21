import { z } from "zod";

/*
 * Co-located per the project's zod_schema_standard:
 *   features/users/schemas/user.schema.ts
 *
 * Reuses the SAME rules already established in validation.rules.ts /
 * form.validation.ts (identical mobile regex, identical "required" +
 * "email" composition) rather than introducing a second, parallel
 * validation vocabulary for this one module. If those files migrate to
 * Zod project-wide later, this schema's primitives below are exactly
 * what that migration would produce — nothing here is throwaway.
 */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

const requiredText = (fieldLabel: string) =>
	z.string().trim().min(1, `${fieldLabel} is required.`);

const emailSchema = z
	.string()
	.trim()
	.min(1, "Email is required.")
	.email("Enter a valid email address.");

const mobileSchema = z
	.string()
	.trim()
	.min(1, "Phone number is required.")
	.regex(INDIAN_MOBILE_REGEX, "Enter a valid 10-digit mobile number.");

/*
 * userType/grade/joinedOn/businessPartnerId are intentionally NOT
 * .optional() by default just because CreateUserInput types them as
 * optional at the API layer — per the standard, form-requirement and
 * API-optionality are separate concerns. These stay optional here only
 * because the existing EditableCard form genuinely allows saving without
 * them today; tighten per-field once product confirms which of these are
 * actually mandatory at creation vs. editable-later.
 */
export const userBasicInfoSchema = z.object({
	employeeCode: requiredText("Employee code"),
	firstName: requiredText("First name"),
	lastName: requiredText("Last name"),
	email: emailSchema,
	phoneNumber: mobileSchema,
	// Required on create only — see buildUserSchema() below, which is why
	// this base schema alone is not "the" user schema.
	password: z.string().optional(),
	userType: z.enum(["Select", "THCM", "DEALER", "CUSTOMER"]).optional(),
	grade: z.string().optional(),
	joinedOn: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const userOrganizationSchema = z.object({
	region: requiredText("Region"),
	address: requiredText("Address"),
	zone: requiredText("Zone"),
	branch: requiredText("Branch"),
	department: requiredText("Department"),
	role: requiredText("Role"),
	designation: requiredText("Designation"),
	vertical: requiredText("Vertical"),
	managerCode1: requiredText("Manager Code 1"),
	managerCode2: requiredText("Manager Code 2"),
	businessPartnerId: z.string().optional(),
	bydId: requiredText("BYD ID"),
	s4Id: requiredText("S4 ID"),
	tallyId: requiredText("Tally ID"),
	c4cId: requiredText("C4C ID"),
});

/*
 * Schema-factory pattern (per the standard): password is required on
 * create, optional on edit (an empty password field means "don't change
 * it", matching mapUserFormToUpdatePayload's existing behavior of
 * dropping an empty password from the update payload).
 */
export const buildUserBasicInfoSchema = (mode: "create" | "edit") =>
	mode === "create"
		? userBasicInfoSchema.extend({
				password: z.string().min(8, "Password must be at least 8 characters."),
			})
		: userBasicInfoSchema;

export type UserBasicInfoFormValues = z.infer<typeof userBasicInfoSchema>;
export type UserOrganizationFormValues = z.infer<typeof userOrganizationSchema>;
