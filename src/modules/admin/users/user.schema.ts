import { z } from "zod";

import { parseDateOnly } from "./user-management.utils";

/*
 * Single validation path for the User form (Basic Info / Organization
 * Details cards). useUsersData.handleSubmitUser calls validateUserSection()
 * and merges the result into fieldErrors, which CreateUserForm renders.
 * Do not add parallel manual checks in the hook.
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

// joinedOn is "YYYY-MM-DD" (toDateOnlyString in CreateUserForm). Must be
// before today, matching the DatePickerInput restriction (toDate = yesterday).
// Format and "past" are separate rules so a malformed value can never be
// reported as "must be before today" again.
const isValidDateOnly = (value: string) => parseDateOnly(value) !== null;

const isBeforeToday = (value: string) => {
	const date = parseDateOnly(value);
	// Unparseable values are reported by isValidDateOnly, not here.
	if (!date) return true;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return date < today;
};

const JOINED_ON_INVALID_MESSAGE = "Enter a valid joining date.";
const JOINED_ON_PAST_MESSAGE = "Joining date must be before today.";

const baseBasicInfoSchema = z.object({
	employeeCode: requiredText("Employee code"),
	firstName: requiredText("First name"),
	lastName: requiredText("Last name"),
	email: emailSchema,
	phoneNumber: mobileSchema,
	// Password input is commented out in CreateUserForm, so it must not be
	// required here. Re-add a create-only rule when that field returns.
	password: z.string().optional(),
	userType: z.enum(["Select", "THCM", "DEALER", "CUSTOMER"]).optional(),
	grade: z.string().optional(),
	isActive: z.boolean().optional(),
});

/*
 * Schema factory — mirrors the existing create/edit rules:
 *   - businessPartnerId: required on create, optional on edit
 *   - joinedOn: optional on create, required on edit; always past-only
 */
export const buildUserBasicInfoSchema = (mode: "create" | "edit") =>
	mode === "create"
		? baseBasicInfoSchema.extend({
				businessPartnerId: requiredText("Business partner"),
				joinedOn: z
					.string()
					.trim()
					.optional()
					.refine((value) => !value || isValidDateOnly(value), {
						message: JOINED_ON_INVALID_MESSAGE,
					})
					.refine((value) => !value || isBeforeToday(value), {
						message: JOINED_ON_PAST_MESSAGE,
					}),
			})
		: baseBasicInfoSchema.extend({
				businessPartnerId: z.string().optional(),
				joinedOn: requiredText("Joining date")
					.refine(isValidDateOnly, { message: JOINED_ON_INVALID_MESSAGE })
					.refine(isBeforeToday, { message: JOINED_ON_PAST_MESSAGE }),
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
	bydId: requiredText("BYD ID"),
	s4Id: requiredText("S4 ID"),
	tallyId: requiredText("Tally ID"),
	c4cId: requiredText("C4C ID"),
});

export type UserBasicInfoFormValues = z.infer<
	ReturnType<typeof buildUserBasicInfoSchema>
>;
export type UserOrganizationFormValues = z.infer<typeof userOrganizationSchema>;

export type UserBasicInfoField = keyof UserBasicInfoFormValues;

export type UserFormSection = "basic" | "organization";
export type UserSchemaField =
	| keyof UserBasicInfoFormValues
	| keyof UserOrganizationFormValues;
export type UserSchemaFieldErrors = Partial<Record<UserSchemaField, string>>;

/*
 * Validates ONE card's fields only, so saving one card never fails because
 * of the other card's fields. z.object strips unknown keys (workspaceId,
 * avatar, the other card's fields), so passing full form values is safe.
 * Returns {} when valid, otherwise the first message per field.
 */
export const validateUserSection = (
	section: UserFormSection,
	values: unknown,
	mode: "create" | "edit",
): UserSchemaFieldErrors => {
	const schema =
		section === "basic"
			? buildUserBasicInfoSchema(mode)
			: userOrganizationSchema;

	const result = schema.safeParse(values);
	if (result.success) return {};

	const shape: object = schema.shape;
	const isSchemaField = (key: PropertyKey): key is UserSchemaField =>
		typeof key === "string" && key in shape;

	const errors: UserSchemaFieldErrors = {};
	for (const issue of result.error.issues) {
		const key = issue.path[0];
		if (isSchemaField(key) && !errors[key]) {
			errors[key] = issue.message;
		}
	}
	return errors;
};

/*
 * Live (onChange) validation for a single Basic Info field. Uses the same
 * field schema as validateUserSection, so there is still exactly one set of
 * rules — this only changes WHEN they run, not what they are.
 * Returns the first error message, or undefined when the value is valid.
 */
export const validateUserBasicField = (
	field: UserBasicInfoField,
	value: unknown,
	mode: "create" | "edit",
): string | undefined => {
	const fieldSchema: z.ZodTypeAny = buildUserBasicInfoSchema(mode).shape[field];
	const result = fieldSchema.safeParse(value);

	return result.success ? undefined : result.error.issues[0]?.message;
};
