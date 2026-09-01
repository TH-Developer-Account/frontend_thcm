// statusAlert.helper.ts

import type { AlertVariant } from "../components/common/common.types";

export type StatusAlertConfig = {
	variant: AlertVariant;
	title: string;
	description: string;
};

const SUCCESS_STATUSES = new Set([
	"APPROVED",
	"ACCEPTED",
	"ACCEPT_AND_CLOSE",
	"CLOSED",
	"VALIDATED",
	"CONDUCTED",
]);

const ERROR_STATUSES = new Set(["REJECTED", "CANCELLED", "CANCELED"]);

const WARNING_STATUSES = new Set([
	"CLARIFY",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
	"CLARIFIED",
]);

// Everything NOT in the three sets above (PENDING, IN_PROGRESS, INITIATED,
// SUBMITTED, RESUBMITTED, SENT_FOR_APPROVAL, WORKFLOW_ASSIGNED,
// WORKFLOW_STARTED, DEVIATION_RAISED, DRAFT, etc.) is treated as "in
// progress" and intentionally does NOT get a banner — getStatusAlertConfig
// returns null for these, per the requirement to only show the banner for
// approved/rejected/cancelled/clarification states.

const TITLE_OVERRIDES: Record<string, string> = {
	APPROVED: "Approved",
	ACCEPTED: "Accepted",
	ACCEPT_AND_CLOSE: "Accepted and Closed",
	CLOSED: "Closed",
	VALIDATED: "Validated",
	CONDUCTED: "Conducted",
	REJECTED: "Rejected",
	CANCELLED: "Cancelled",
	CANCELED: "Cancelled",
	CLARIFY: "Clarification Requested",
	CLARIFICATION_REQUESTED: "Clarification Requested",
	THCM_CLARIFICATION_REQUESTED: "Clarification Requested",
	CLARIFIED: "Clarified",
};

const normalizeStatus = (status: string): string =>
	status
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_");

const titleCaseFallback = (normalized: string): string =>
	normalized
		.split("_")
		.filter(Boolean)
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");

export type GetStatusAlertOptions = {
	entityLabel?: string;
	title?: string;
	description?: string;
};

/**
 * Returns a banner config only for approved/rejected/cancelled/clarification
 * statuses. Returns null for anything "in progress" (pending, initiated,
 * submitted, sent for approval, workflow assigned, draft, etc.) — those
 * should not show a status banner at all.
 */
export const getStatusAlertConfig = (
	status: string | null | undefined,
	options: GetStatusAlertOptions = {},
): StatusAlertConfig | null => {
	if (!status) return null;

	const normalized = normalizeStatus(status);

	let variant: AlertVariant;
	if (SUCCESS_STATUSES.has(normalized)) {
		variant = "success";
	} else if (ERROR_STATUSES.has(normalized)) {
		variant = "error";
	} else if (WARNING_STATUSES.has(normalized)) {
		variant = "warning";
	} else {
		// in-progress / unrecognized -> no banner
		return null;
	}

	const title =
		options.title ??
		TITLE_OVERRIDES[normalized] ??
		titleCaseFallback(normalized);

	const entity = options.entityLabel ? ` ${options.entityLabel}` : " item";
	const description =
		options.description ?? `This${entity} has been ${title.toLowerCase()}.`;

	return { variant, title, description };
};
