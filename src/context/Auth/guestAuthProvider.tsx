import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import { GuestAuthContext } from "./GuestAuthContext";
import type { Guest, GuestAuthContextType } from "./GuestAuthContext";
import { useToast } from "../Auth/AuthContext";
import { GuestAxios } from "../../services/GuestAxios";
import {
	buildGuestLoginUrl,
	clearGuestSession,
	getTokenExpiry,
	readGuestSession,
	readGuestToken,
	writeGuestSession,
} from "./guestSession";
import { normalizeIndianMobile } from "../../modules/guest/guestAuth/guestLogin.schemas";
import { MEDICLAIM_BACKEND } from "../../modules/medicalReimbursment/utils/mediclaimBackend.config";

const guest_api_routes = {
	send_otp: "/guest/send-otp",
	verify_otp: "/guest/verify-otp",
	login: "/guest/login",
	reset_password: "/guest/reset-password",
};

/** Requests whose 401 means "wrong credentials", not "session expired". */
const AUTH_ENDPOINTS = Object.values(guest_api_routes);

interface GuestAuthProviderProps {
	children: ReactNode;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		if (!error.response) return "Unable to reach the server. Check your connection and try again.";
		if (error.response.status === 429) {
			return error.response.data?.message || "Too many attempts. Please wait a few minutes and try again.";
		}
		return error.response.data?.message || fallback;
	}
	if (error instanceof Error) return error.message;
	return fallback;
}

type LoginResponse = { accessToken?: string; guest?: Guest };

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
	const [guest, setGuest] = useState<Guest | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { showToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const expiryTimerRef = useRef<number | undefined>(undefined);
	const locationRef = useRef(location);
	locationRef.current = location;

	const logout = useCallback<GuestAuthContextType["logout"]>(
		(options = {}) => {
			window.clearTimeout(expiryTimerRef.current);
			clearGuestSession();
			setGuest(null);
			const current = locationRef.current;
			const redirectTo =
				options.redirectTo ?? (options.expired ? `${current.pathname}${current.search}` : undefined);
			// Router navigation keeps the app's basename (no hardcoded "/web").
			navigate(buildGuestLoginUrl(redirectTo, options.expired ? "expired" : undefined), {
				replace: true,
			});
		},
		[navigate],
	);

	/** Logs out automatically the moment the 24h token expires. */
	const scheduleExpiry = useCallback(
		(token: string) => {
			window.clearTimeout(expiryTimerRef.current);
			const expiry = getTokenExpiry(token);
			if (!expiry) return;
			const delay = Math.max(expiry - Date.now(), 0);
			// setTimeout overflows above ~24.8 days; guest tokens live 24h.
			if (delay < 2 ** 31 - 1) {
				expiryTimerRef.current = window.setTimeout(() => logout({ expired: true }), delay);
			}
		},
		[logout],
	);

	// Restore the session on load; an expired/corrupt one is cleared.
	useEffect(() => {
		const session = readGuestSession();
		if (session) {
			setGuest(session.guest);
			scheduleExpiry(session.token);
		} else {
			clearGuestSession();
		}
		setIsLoading(false);
		return () => window.clearTimeout(expiryTimerRef.current);
	}, [scheduleExpiry]);

	// Any 401 from a guest API call (outside the login endpoints) means the
	// session is gone — send the guest back to login and remember where they were.
	useEffect(() => {
		const interceptorId = GuestAxios.interceptors.response.use(
			(response: unknown) => response,
			(error: unknown) => {
				if (axios.isAxiosError(error) && error.response?.status === 401) {
					const url = error.config?.url ?? "";
					const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
					if (!isAuthCall && readGuestToken()) {
						showToast({
							type: "error",
							title: "Session expired",
							description: "Please sign in again to continue.",
						});
						logout({ expired: true });
					}
				}
				return Promise.reject(error);
			},
		);
		return () => GuestAxios.interceptors.response.eject(interceptorId);
	}, [logout, showToast]);

	const persistGuestSession = useCallback(
		(data: LoginResponse) => {
			if (!data?.accessToken || !data.guest?.id) {
				throw new Error("The server returned an incomplete login response.");
			}
			writeGuestSession(data.accessToken, data.guest);
			setGuest(data.guest);
			scheduleExpiry(data.accessToken);
		},
		[scheduleExpiry],
	);

	const sendOtp = useCallback(
		async (mobile: string) => {
			try {
				await GuestAxios.post(guest_api_routes.send_otp, {
					mobile: normalizeIndianMobile(mobile),
				});
				showToast({
					type: "success",
					title: "OTP sent",
					description: "A verification code was sent to your mobile number.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to send OTP",
					description: getErrorMessage(error, "Failed to send OTP"),
				});
				throw error;
			}
		},
		[showToast],
	);

	const verifyOtp = useCallback(
		async (mobile: string, otp: string) => {
			try {
				const { data } = await GuestAxios.post<LoginResponse>(guest_api_routes.verify_otp, {
					mobile: normalizeIndianMobile(mobile),
					otp: otp.trim(),
				});
				persistGuestSession(data);
				showToast({
					type: "success",
					title: "Signed in",
					description: "You have logged in successfully.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Verification failed",
					description: getErrorMessage(error, "Invalid OTP"),
				});
				throw error;
			}
		},
		[persistGuestSession, showToast],
	);

	const loginWithPassword = useCallback(
		async (email: string, password: string) => {
			// The backend matches the email exactly. New guest logins are saved
			// lower-case; older ones may not be, so on "invalid credentials"
			// retry once with the email exactly as typed.
			const typed = email.trim();
			const lower = typed.toLowerCase();
			const attempt = (value: string) =>
				GuestAxios.post<LoginResponse>(guest_api_routes.login, { email: value, password });
			try {
				let response;
				try {
					response = await attempt(lower);
				} catch (error) {
					const unauthorized =
						axios.isAxiosError(error) && error.response?.status === 401;
					if (!unauthorized || typed === lower) throw error;
					response = await attempt(typed);
				}
				persistGuestSession(response.data);
				showToast({
					type: "success",
					title: "Signed in",
					description: "You have logged in successfully.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Sign-in failed",
					description: getErrorMessage(error, "Invalid credentials"),
				});
				throw error;
			}
		},
		[persistGuestSession, showToast],
	);

	const requestPasswordReset = useCallback(
		async (email: string) => {
			if (!MEDICLAIM_BACKEND.guestPasswordReset) {
				showToast({
					type: "error",
					title: "Password reset isn't available yet",
					description:
						"Sign in with your mobile number and OTP instead, or contact HR to have your password re-sent.",
				});
				throw new Error("Password reset is not available.");
			}
			try {
				await GuestAxios.post(guest_api_routes.reset_password, {
					email: email.trim().toLowerCase(),
				});
				showToast({
					type: "success",
					title: "Check your email",
					description:
						"If an account exists for this email, a new password has been sent to it.",
				});
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to reset password",
					description: getErrorMessage(error, "Please try again later."),
				});
				throw error;
			}
		},
		[showToast],
	);

	const value = useMemo<GuestAuthContextType>(
		() => ({
			guest,
			isLoading,
			isAuthenticated: Boolean(guest),
			sendOtp,
			verifyOtp,
			loginWithPassword,
			requestPasswordReset,
			logout,
		}),
		[guest, isLoading, loginWithPassword, logout, requestPasswordReset, sendOtp, verifyOtp],
	);

	return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}
