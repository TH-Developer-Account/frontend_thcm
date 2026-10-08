// src/utils/apiError.ts

import type { ToastInput } from "../context/Toast/toast.types";

export type ApiErrorResponse = {
	success?: boolean;
	statusCode?: number;
	message?: string;
	errors?: Record<string, string[]>;
};

type AxiosLikeError = {
	response?: {
		data?: ApiErrorResponse | string;
		status?: number;
	};
	message?: string;
};

type ShowToastFn = (toast: ToastInput) => void;

// apiError.helper.ts
export const getApiErrorMessage = (
	error: unknown,
	fallback = "Something went wrong. Please try again.",
): string => {
	if (!error) return fallback;

	const err = error as {
		response?: { data?: { message?: string } };
		message?: string;
	};

	return err.response?.data?.message ?? err.message ?? fallback;
};

export const getApiFieldErrors = (error: unknown): Record<string, string[]> => {
	const err = error as AxiosLikeError;
	const data = err.response?.data;

	if (typeof data === "object" && data?.errors) {
		return data.errors;
	}

	return {};
};

export function showApiErrorToast(
	showToast: ShowToastFn,
	error: unknown,
	fallback = "Something went wrong.",
	// Optional so every existing call site (which passes only a fallback
	// message) keeps its current "Error" title unchanged. Callers that want
	// a distinctive, action-specific title (e.g. "Unable to update
	// initiation") can pass it explicitly instead of overloading `fallback`
	// to double as both the description and an implied title.
	title = "Error",
) {
	showToast({
		type: "error",
		title,
		description: getApiErrorMessage(error, fallback),
	});
}

export function showSuccessToast(
	showToast: ShowToastFn,
	description: string,
	title = "Success",
) {
	showToast({
		type: "success",
		title,
		description,
	});
}

export function showInfoToast(
	showToast: ShowToastFn,
	description: string,
	title = "Info",
) {
	showToast({
		type: "info",
		title,
		description,
	});
}

export function showWarningToast(
	showToast: ShowToastFn,
	description: string,
	title = "Warning",
) {
	showToast({
		type: "warning",
		title,
		description,
	});
}
