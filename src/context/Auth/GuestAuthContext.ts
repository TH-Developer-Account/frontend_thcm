import { createContext } from "react";

export interface Guest {
	id: string;
	mobile: string | null;
	email: string | null;
	name?: string | null;
	first_name?: string;
	last_name?: string;
	firstName?: string;
	lastName?: string;
	phone_number?: string;
}

export interface GuestAuthContextType {
	guest: Guest | null;
	isLoading: boolean;
	isAuthenticated: boolean;

	// Mobile + OTP
	sendOtp: (mobile: string) => Promise<void>;
	verifyOtp: (mobile: string, otp: string) => Promise<void>;

	// Email + Password
	loginWithPassword: (email: string, password: string) => Promise<void>;
	/** Emails a new password if the account exists (always resolves the same way). */
	requestPasswordReset: (email: string) => Promise<void>;

	/** Ends the session. `expired` shows "session expired" on the login page. */
	logout: (options?: { expired?: boolean; redirectTo?: string }) => void;
}

export const GuestAuthContext = createContext<GuestAuthContextType | null>(
	null,
);
