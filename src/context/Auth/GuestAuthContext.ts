import { createContext } from "react";

export interface Guest {
	id: string;
	mobile: string | null;
	email: string | null;
	first_name?: string;
	last_name?: string;
}

export interface GuestAuthContextType {
	guest: Guest | null;
	isLoading: boolean;

	// Mobile + OTP
	sendOtp: (mobile: string) => Promise<void>;
	verifyOtp: (mobile: string, otp: string) => Promise<void>;

	// Email + Password
	loginWithPassword: (email: string, password: string) => Promise<void>;

	logout: () => void;
}

export const GuestAuthContext = createContext<GuestAuthContextType | null>(
	null,
);
