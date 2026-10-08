import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useGuestAuth } from "../../../context/Auth/useGuestAuth";
import { MEDICLAIM_BACKEND } from "../../medicalReimbursment/utils/mediclaimBackend.config";
import { sanitizeGuestRedirect } from "../../../context/Auth/guestSession";
import {
	OTP_RESEND_COOLDOWN_SECONDS,
	guestPasswordLoginSchema,
	guestPasswordResetSchema,
	guestSendOtpSchema,
	guestVerifyOtpSchema,
} from "./guestLogin.schemas";

export type GuestLoginMode = "otp" | "password" | "reset";

type FieldErrors = Partial<Record<"mobile" | "otp" | "email" | "password", string>>;

const firstErrors = (issues: Array<{ path: PropertyKey[]; message: string }>): FieldErrors => {
	const errors: FieldErrors = {};
	for (const issue of issues) {
		const key = String(issue.path[0]) as keyof FieldErrors;
		if (!errors[key]) errors[key] = issue.message;
	}
	return errors;
};

/**
 * All state + actions for the guest login screen (mobile + OTP, email +
 * password, and "email me a new password"). The page only renders.
 *
 *  - Validates with zod before any request (Indian mobile, 4–6 digit OTP, email).
 *  - Toasts for API success/failure come from GuestAuthProvider; this hook
 *    only shows field errors.
 *  - After sign-in, returns to `?redirect=` (sanitised) or the claim list.
 *  - `?reason=expired` → `sessionExpired` so the page can show a notice.
 */
export function useGuestLoginForm() {
	const { sendOtp, verifyOtp, loginWithPassword, requestPasswordReset, isAuthenticated, isLoading } =
		useGuestAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirectTo = sanitizeGuestRedirect(searchParams.get("redirect"));
	const sessionExpired = searchParams.get("reason") === "expired";

	const [mode, setMode] = useState<GuestLoginMode>("otp");
	const [mobile, setMobile] = useState("");
	const [otp, setOtp] = useState("");
	const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [resetRequested, setResetRequested] = useState(false);
	const cooldownTimer = useRef<number | undefined>(undefined);

	// Already signed in (e.g. opened /guest/login in a new tab) → go straight
	// in. Only once: after navigating, `redirect` is gone from the URL.
	const autoRedirected = useRef(false);
	useEffect(() => {
		if (autoRedirected.current || isLoading || !isAuthenticated) return;
		autoRedirected.current = true;
		navigate(redirectTo, { replace: true });
	}, [isAuthenticated, isLoading, navigate, redirectTo]);

	useEffect(() => {
		if (cooldown <= 0) return;
		cooldownTimer.current = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
		return () => window.clearTimeout(cooldownTimer.current);
	}, [cooldown]);

	const clearError = (key: keyof FieldErrors) =>
		setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));

	const changeMode = useCallback((next: GuestLoginMode) => {
		// No reset endpoint on the current backend — stay on the sign-in form.
		if (next === "reset" && !MEDICLAIM_BACKEND.guestPasswordReset) return;
		setMode(next);
		setErrors({});
		setResetRequested(false);
	}, []);

	const handleMobileChange = (value: string) => {
		// Allow +, spaces and digits while typing; normalised on submit.
		setMobile(value.replace(/[^\d+\s-]/g, "").slice(0, 16));
		clearError("mobile");
		if (otpSentTo) {
			setOtpSentTo(null);
			setOtp("");
		}
	};

	const handleOtpChange = (value: string) => {
		setOtp(value.replace(/\D/g, "").slice(0, 6));
		clearError("otp");
	};

	const handleEmailChange = (value: string) => {
		setEmail(value.trim());
		clearError("email");
	};

	const handlePasswordChange = (value: string) => {
		setPassword(value);
		clearError("password");
	};

	const run = async (action: () => Promise<void>) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await action();
		} catch {
			// Provider already toasted the server's message.
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSendOtp = () =>
		run(async () => {
			if (cooldown > 0) return;
			const result = guestSendOtpSchema.safeParse({ mobile });
			if (!result.success) {
				setErrors(firstErrors(result.error.issues));
				return;
			}
			await sendOtp(result.data.mobile);
			setOtpSentTo(result.data.mobile);
			setOtp("");
			setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
		});

	const handleVerifyOtp = () =>
		run(async () => {
			const result = guestVerifyOtpSchema.safeParse({ mobile: otpSentTo ?? mobile, otp });
			if (!result.success) {
				setErrors(firstErrors(result.error.issues));
				return;
			}
			await verifyOtp(result.data.mobile, result.data.otp);
			navigate(redirectTo, { replace: true });
		});

	const handlePasswordLogin = () =>
		run(async () => {
			const result = guestPasswordLoginSchema.safeParse({ email, password });
			if (!result.success) {
				setErrors(firstErrors(result.error.issues));
				return;
			}
			try {
				// Pass the trimmed email as typed — the provider tries lower-case
				// first and falls back to this for older mixed-case logins.
				await loginWithPassword(email.trim(), result.data.password);
			} catch (error) {
				setPassword("");
				throw error;
			}
			navigate(redirectTo, { replace: true });
		});

	const handleRequestReset = () =>
		run(async () => {
			const result = guestPasswordResetSchema.safeParse({ email });
			if (!result.success) {
				setErrors(firstErrors(result.error.issues));
				return;
			}
			await requestPasswordReset(result.data.email);
			setResetRequested(true);
		});

	return {
		mode,
		changeMode,
		/** false → hide "Forgot password?" and show "Contact HR to re-send your password". */
		canResetPassword: MEDICLAIM_BACKEND.guestPasswordReset,
		sessionExpired,
		redirectTo,

		mobile,
		otp,
		otpSent: Boolean(otpSentTo),
		otpSentTo,
		resendCooldown: cooldown,
		email,
		password,
		errors,
		isSubmitting,
		resetRequested,

		handleMobileChange,
		handleOtpChange,
		handleEmailChange,
		handlePasswordChange,
		handleSendOtp,
		handleVerifyOtp,
		handlePasswordLogin,
		handleRequestReset,
	};
}
