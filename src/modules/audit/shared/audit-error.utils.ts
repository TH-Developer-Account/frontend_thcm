// modules/audit/shared/audit-error.utils.ts
//
// Maps transport errors to the user-facing messages agreed for the audit
// modules. Wraps the shared API-error helper; never exposes raw payloads.

import { getApiErrorMessage } from "../../../utils/apiError.helper";

/** One per-field validation message from a 422 response. */
export interface ServerFieldError {
	path: string;
	message: string;
}

type ErrorWithResponse = {
	response?: { status?: number; data?: { errors?: unknown } };
	code?: string;
	name?: string;
};

export const getHttpStatus = (error: unknown): number | undefined =>
	typeof error === "object" && error !== null
		? (error as ErrorWithResponse).response?.status
		: undefined;

export const isAbortError = (error: unknown): boolean =>
	typeof error === "object" &&
	error !== null &&
	((error as ErrorWithResponse).name === "AbortError" ||
		(error as ErrorWithResponse).code === "ERR_CANCELED");

/**
 * Field-level messages from a 422 response
 * (`{ errors: [{ path, message }] }`). Empty when the error has none.
 */
export function getApiFieldErrors(error: unknown): ServerFieldError[] {
	if (typeof error !== "object" || error === null) return [];
	const errors = (error as ErrorWithResponse).response?.data?.errors;
	if (!Array.isArray(errors)) return [];
	return errors.filter(
		(item): item is ServerFieldError =>
			typeof item === "object" &&
			item !== null &&
			typeof (item as ServerFieldError).message === "string",
	);
}

/** "parameters.2.title" -> "Parameter 3: " so the user knows where to look. */
const describeFieldPath = (path: string): string => {
	const match = /^parameters\.(\d+)\./.exec(path);
	return match ? `Parameter ${Number(match[1]) + 1}: ` : "";
};

const MAX_SUMMARISED_FIELD_ERRORS = 3;

/** One readable line for toasts: the real messages, not "fix the fields". */
export function summarizeFieldErrors(errors: readonly ServerFieldError[]): string {
	const lines = Array.from(
		new Set(errors.map((e) => `${describeFieldPath(e.path)}${e.message}`)),
	);
	const shown = lines.slice(0, MAX_SUMMARISED_FIELD_ERRORS).join(" · ");
	const extra = lines.length - MAX_SUMMARISED_FIELD_ERRORS;
	return extra > 0 ? `${shown} (+${extra} more)` : shown;
}

const isNetworkError = (error: unknown): boolean =>
	typeof error === "object" &&
	error !== null &&
	!("response" in error && (error as ErrorWithResponse).response) &&
	(error as ErrorWithResponse).code === "ERR_NETWORK";

export function getAuditActionErrorMessage(
	error: unknown,
	subject = "record",
): string {
	if (isNetworkError(error)) {
		return "Your changes could not be synchronized. Check your connection and retry.";
	}

	switch (getHttpStatus(error)) {
		case 403:
			return "You do not have permission to perform this action.";
		case 404:
			return `This ${subject} could not be found or is no longer available.`;
		case 409:
			// The server explains WHY (stale save, draft already exists, used by
			// audits…), so prefer its message over a generic one.
			return getApiErrorMessage(
				error,
				`This ${subject} was updated by another user. Refresh before continuing.`,
			);
		case 422: {
			// The server says exactly what is wrong; show that, not a generic
			// "fix the highlighted fields".
			const fieldErrors = getApiFieldErrors(error);
			if (fieldErrors.length > 0) return summarizeFieldErrors(fieldErrors);
			return getApiErrorMessage(
				error,
				"Review the highlighted fields and complete the required information.",
			);
		}
		default:
			return getApiErrorMessage(error, "Something went wrong. Please retry.");
	}
}
