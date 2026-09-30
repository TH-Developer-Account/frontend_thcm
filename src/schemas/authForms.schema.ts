// src/schemas/authForms.schema.ts
//
// Single source of truth for every auth-form's client-side validation
// (email/mobile login, guest email/mobile login, forgot password, reset
// password). Each schema mirrors the manual validation the corresponding
// form used to hand-roll — same messages, same rules — so this migration
// changes *how* validation runs (Zod + React Hook Form), not what it
// validates. See the components in containers/Login/authforms for the
// RHF wiring.
//
// Regexes intentionally match containers/Login/constant.ts's EMAIL_REGEX /
// MOBILE_REGEX exactly rather than redefining stricter ones here — this is
// the same validation, just declared once instead of duplicated per form.

import { z } from "zod";

import { PasswordPolicy } from "../containers/Login/constant";

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;

/* =====================================================
   EMAIL LOGIN (and guest email login — identical rules)
===================================================== */

export const emailLoginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.regex(EMAIL_REGEX, "Enter a valid email address"),

	password: z.string().min(1, "Password is required"),
});

export type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;

// Guest email login has always used the same two rules as the THCM email
// login — kept as a named alias (rather than importing emailLoginSchema
// directly in the guest form) so the two can diverge later without a
// silent behavior change to both at once.
export const guestEmailLoginSchema = emailLoginSchema;
export type GuestEmailLoginFormValues = z.infer<typeof guestEmailLoginSchema>;

/* =====================================================
   MOBILE LOGIN — step 1: enter mobile number
   (shared by the THCM and guest mobile login flows)
===================================================== */

export const mobileEntrySchema = z.object({
	mobile: z
		.string()
		.trim()
		.regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number"),
});

export type MobileEntryFormValues = z.infer<typeof mobileEntrySchema>;

/* =====================================================
   MOBILE LOGIN — step 2: verify OTP
   (shared by the THCM and guest mobile login flows)
===================================================== */

export const otpVerifySchema = z.object({
	otp: z
		.string()
		.trim()
		.regex(OTP_REGEX, "Enter the complete 6-digit OTP"),
});

export type OtpVerifyFormValues = z.infer<typeof otpVerifySchema>;

/* =====================================================
   FORGOT PASSWORD
===================================================== */

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.regex(EMAIL_REGEX, "Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/* =====================================================
   RESET PASSWORD
   Two call sites, two rule sets:
     - authenticated "change password" (no token in the URL) requires the
       current password
     - tokenized "set new password" (from an email link) does not
   requiresOldPassword mirrors the original component's `!token` check —
   still decided by the caller, not guessed inside the schema.
===================================================== */

const passwordMeetsPolicy = (value: string) =>
	PasswordPolicy.every((rule) => rule.test(value));

export const buildResetPasswordSchema = (requiresOldPassword: boolean) =>
	z
		.object({
			oldPassword: z.string().default(""),
			newPassword: z.string().min(1, "New password is required"),
			confirmPassword: z.string().min(1, "Confirm your new password"),
		})
		.superRefine((values, ctx) => {
			if (requiresOldPassword && !values.oldPassword.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["oldPassword"],
					message: "Current password is required",
				});
			}

			if (
				values.newPassword.length > 0 &&
				!passwordMeetsPolicy(values.newPassword)
			) {
				ctx.addIssue({
					code: "custom",
					path: ["newPassword"],
					message: "Password does not meet all requirements",
				});
			}

			if (
				values.confirmPassword.length > 0 &&
				values.confirmPassword !== values.newPassword
			) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmPassword"],
					message: "Passwords do not match",
				});
			}
		});

export type ResetPasswordFormValues = z.infer<
	ReturnType<typeof buildResetPasswordSchema>
>;
