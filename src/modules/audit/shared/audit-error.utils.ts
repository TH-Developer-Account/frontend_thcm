// modules/audit/shared/audit-error.utils.ts
//
// Maps transport errors to the user-facing messages agreed for the audit
// modules. Wraps the shared API-error helper; never exposes raw payloads.

import { getApiErrorMessage } from "../../../utils/apiError.helper";

type ErrorWithResponse = {
	response?: { status?: number };
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
			return `This ${subject} was updated by another user. Refresh before continuing.`;
		case 422:
			return getApiErrorMessage(
				error,
				"Review the highlighted fields and complete the required information.",
			);
		default:
			return getApiErrorMessage(error, "Something went wrong. Please retry.");
	}
}
