import { z } from "zod";

/** "+91 98765-43210" / "098765 43210" → "9876543210" (other input is returned trimmed). */
export const normalizeIndianMobile = (value: string): string => {
	const digits = value.replace(/[\s\-()]/g, "");
	const stripped = digits.replace(/^(\+91|91|0)(?=\d{10}$)/, "");
	return /^\d{10}$/.test(stripped) ? stripped : value.trim();
};

const mobileField = z
	.string({ message: "Mobile number is required." })
	.trim()
	.min(1, "Mobile number is required.")
	.transform(normalizeIndianMobile)
	.pipe(
		z.string().regex(/^[6-9]\d{9}$/, "Enter the 10-digit mobile number you used on your claim."),
	);

export const guestSendOtpSchema = z.object({ mobile: mobileField });

export const guestVerifyOtpSchema = z.object({
	mobile: mobileField,
	otp: z
		.string({ message: "Enter the OTP." })
		.trim()
		.regex(/^\d{4,6}$/, "Enter the 4–6 digit code sent to your mobile."),
});

const emailField = z
	.string({ message: "Email is required." })
	.trim()
	.min(1, "Email is required.")
	.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address.")
	.transform((value) => value.toLowerCase());

export const guestPasswordLoginSchema = z.object({
	email: emailField,
	password: z.string({ message: "Password is required." }).min(1, "Password is required."),
});

export const guestPasswordResetSchema = z.object({ email: emailField });

export type GuestSendOtpInput = z.infer<typeof guestSendOtpSchema>;
export type GuestVerifyOtpInput = z.infer<typeof guestVerifyOtpSchema>;
export type GuestPasswordLoginInput = z.infer<typeof guestPasswordLoginSchema>;

/** Seconds before "Resend OTP" is enabled again. */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
