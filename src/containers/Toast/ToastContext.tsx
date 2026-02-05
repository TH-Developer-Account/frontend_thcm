import { createContext, useContext } from "react";
import type { ToastInput } from "./toast.types";

export type ShowToastFn = (toast: ToastInput) => void;

interface ToastContextType {
	showToast: ShowToastFn;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) {
		throw new Error("useToast must be used inside ToastProvider");
	}
	return ctx;
};
