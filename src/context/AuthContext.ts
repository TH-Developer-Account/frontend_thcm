import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ToastInput } from "../containers/Toast/toast.types";

// Interfaces
export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
}

export interface ToastContextType {
	showToast: ShowToastFn;
}

export interface AuthContextType {
	user: User | null;
	login: (
		email: string,
		password: string,
	) => Promise<{ requiresPasswordReset: boolean }>;
	logout: () => void;
	resetPassword: (currentPassword: string, newPassword: string) => void;
	isLoading: boolean;
	setUser: Dispatch<SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

export type ShowToastFn = (toast: ToastInput) => void;

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used inside ToastProvider");
	}
	return ctx;
};
