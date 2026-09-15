import { z } from "zod";

import type { UserPageMode } from "./user-management.types";

const requiredString = (label: string) =>
	z.string().trim().min(1, `${label} is required.`);

const optionalString = z.string();

const userTypeSchema = z.enum(["Select", "THCM", "DEALER", "CUSTOMER"]);

const baseUserFormShape = {
	avatar: z.unknown().nullable(),

	bydId: optionalString,
	s4Id: optionalString,
	tallyId: optionalString,
	c4cId: optionalString,

	employeeCode: optionalString,

	firstName: requiredString("First name"),
	lastName: requiredString("Last name"),

	password: optionalString,

	phoneNumber: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || /^[6-9]\d{9}$/.test(value),
			"Enter a valid 10-digit phone number.",
		),

	email: z
		.string()
		.trim()
		.min(1, "Email is required.")
		.email("Enter a valid email address."),

	workspaceId: optionalString,

	region: optionalString,
	address: optionalString,
	zone: optionalString,
	branch: optionalString,
	department: optionalString,
	role: optionalString,
	designation: optionalString,
	vertical: optionalString,
	grade: optionalString,

	managerCode1: optionalString,
	managerCode2: optionalString,

	isDefaultContact: z.boolean(),
	isActive: z.boolean(),

	userType: userTypeSchema,
	joinedOn: optionalString,
	businessPartnerId: optionalString,
};

const addUserTypeValidation = (
	values: {
		userType: "Select" | "THCM" | "DEALER" | "CUSTOMER";
	},
	context: z.RefinementCtx,
) => {
	if (values.userType === "Select") {
		context.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["userType"],
			message: "User type is required.",
		});
	}
};

export const createUserFormSchema = z
	.object(baseUserFormShape)
	.superRefine(addUserTypeValidation);

export const editUserFormSchema = z
	.object(baseUserFormShape)
	.superRefine(addUserTypeValidation);

export const getUserFormSchema = (pageMode: UserPageMode) =>
	pageMode === "create" ? createUserFormSchema : editUserFormSchema;
