import { z } from "zod";

/**
 * Single source of truth for user-form validation. Mirrors UserFormValues
 * (user-management.types.ts) field-for-field — keep the two in sync when
 * either changes.
 *
 * Two schema variants:
 *  - baseUserFormSchema: what "create" (step 1 / Basic Info card) validates.
 *  - userFormSchema:     adds Organization Details as required — only
 *                        relevant once a user exists (view/edit mode),
 *                        matching CreateUserForm's `!isCreateMode` gate on
 *                        that card today.
 */

export const userTypeEnum = z.enum(["Select", "THCM", "DEALER", "CUSTOMER"]);

const requiredString = (label: string) =>
	z.string().trim().min(1, `${label} is required.`);

const optionalString = z.string().optional().default("");

export const baseUserFormSchema = z.object({
	avatar: z.custom<File | null>().nullable().optional(),

	// Basic Info — required in both create and edit.
	employeeCode: requiredString("Employee Code"),
	firstName: requiredString("First Name"),
	lastName: requiredString("Last Name"),
	email: requiredString("Email ID").email("Enter a valid email address."),
	phoneNumber: requiredString("Phone Number"),

	// Create-only. Never required on edit — a password reset is a separate
	// dedicated action, matching CreateUserForm's isCreateMode gate.
	password: optionalString,

	// Never user-entered; injected from useAuth() at submit time. Not
	// required here for the same reason it isn't in REQUIRED_USER_FIELDS.
	workspaceId: optionalString,

	userType: userTypeEnum.default("Select"),
	grade: optionalString,
	joinedOn: optionalString,
	isActive: z.boolean().default(true),
	isDefaultContact: z.boolean().default(false),

	// Organization Details — optional at base; tightened to required below
	// for edit mode via organizationRequiredSchema.
	region: optionalString,
	address: optionalString,
	zone: optionalString,
	branch: optionalString,
	department: optionalString,
	role: optionalString,
	designation: optionalString,
	vertical: optionalString,
	managerCode1: optionalString,
	managerCode2: optionalString,
	bydId: optionalString,
	s4Id: optionalString,
	tallyId: optionalString,
	c4cId: optionalString,

	businessPartnerId: optionalString,
});

// Edit/view mode: Organization Details fields become required, matching the
// `organizationFields` in CreateUserForm.tsx (all currently `required: true`).
export const userFormSchema = baseUserFormSchema.extend({
	region: requiredString("Region"),
	address: requiredString("Address"),
	zone: requiredString("Zone"),
	branch: requiredString("Branch"),
	department: requiredString("Department"),
	role: requiredString("Role"),
	designation: requiredString("Designation"),
	vertical: requiredString("Vertical"),
	managerCode1: requiredString("Manager Code 1"),
	managerCode2: requiredString("Manager Code 2"),
	// bydId: requiredString("BYD ID"),
	// s4Id: requiredString("S4 ID"),
	// tallyId: requiredString("Tally ID"),
	// c4cId: requiredString("C4C ID"),
});

export type UserFormSchemaValues = z.infer<typeof userFormSchema>;

/**
 * Returns the schema variant CreateUserForm should validate against for a
 * given page mode — keeps the "org fields only required post-create" rule
 * in one place instead of duplicated in useUsersData's validateForm.
 */
export const getUserFormSchema = (pageMode: "create" | "view" | "list") =>
	pageMode === "create" ? baseUserFormSchema : userFormSchema;
