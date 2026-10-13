import { z } from "zod";

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/*
 * Only the fields a user may edit on their own profile. Email, avatar and
 * address are locked and intentionally absent from this schema.
 */
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
	designation: z.string().trim(),
	department: z.string().trim(),
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;
