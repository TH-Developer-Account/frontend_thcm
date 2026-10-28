import { z } from "zod";

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const userProfileSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required."),
	lastName: z.string().trim().min(1, "Last name is required."),
	phone: z
		.string()
		.trim()
		.refine(
			(value) => value === "" || INDIAN_MOBILE_REGEX.test(value),
			"Enter a valid 10-digit mobile number.",
		),
	// FK id from the Designations master, same as the admin form.
	designationId: z.string().trim(),
	department: z.string().trim(),
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;
