// status.ts — the single place that decides how a business status looks.
//
// Display only: this maps a backend status string to a tone (colour family)
// and a label. It never changes status values, workflow transitions or
// business logic, and it never infers an overall status from events.
//
// Before this file, Badge resolved two classes at once (one from
// styles.constant, one from the marketing module) and every status it did
// not recognise turned amber, so "Recommended" or "Initiated" read as warnings.
// Unknown statuses now render neutral.

export type StatusTone =
	| "success"
	| "danger"
	| "warning"
	| "pending"
	| "info"
	| "neutral"
	| "brand";

/** Normalised key: trimmed, upper-case, spaces/hyphens → "_". */
export const normalizeStatusKey = (status?: string | null): string =>
	String(status ?? "")
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_");

/**
 * Status → tone. Keys are normalised (see normalizeStatusKey).
 * Known statuses keep the colour they had before the revamp; the
 * changes are noted inline.
 */
const STATUS_TONES: Record<string, StatusTone> = {
	// Finished well
	APPROVED: "success",
	ACCEPTED: "success",
	ACCEPT_AND_CLOSE: "success",
	COMPLETED: "success",
	CONDUCTED: "success",
	VALIDATED: "success",
	REPORT_VALIDATED: "success",
	ACTIVE: "success",
	PASSED: "success",

	// Moving through the process
	SUBMITTED: "info",
	RESUBMITTED: "info", // was amber (unknown)
	INITIATED: "info", // was amber (unknown)
	IN_PROGRESS: "info",
	RECOMMENDED: "info", // was amber (unknown)
	WORKFLOW_ASSIGNED: "info", // was amber (unknown)
	WORKFLOW_STARTED: "info", // was amber (unknown)
	REPORT_SUBMITTED: "info",
	REPORT_RESUBMITTED: "info",
	CLARIFIED: "warning",

	// Waiting on someone
	PENDING: "pending",
	SENT_FOR_APPROVAL: "pending", // was amber (unknown): same colour, now explicit
	AWAITING_APPROVAL: "pending",

	// Needs attention
	CLARIFY: "warning",
	CLARIFICATION_REQUESTED: "warning",
	CLARIFICATION_REQUIRED: "warning",
	THCM_CLARIFICATION_REQUESTED: "warning",
	REPORT_CLARIFICATION_REQUESTED: "warning",
	DEVIATION_IN_PROGRESS: "warning",

	// Stopped
	REJECTED: "danger",
	REPORT_REJECTED: "danger",
	CANCELLED: "danger",
	CANCELED: "danger",
	FAILED: "danger",
	NOT_CONDUCTED: "danger",
	DEVIATION_RAISED: "danger",

	/* ---- Module statuses (added after QA: unknown statuses render neutral,
	   so these had lost the amber they showed before Batch 8). Tones are
	   inferred from the names — confirm with the business owners. ---- */
	// Vendor onboarding
	AWAITING_VENDOR: "pending",
	EXTERNAL_REVIEW_PENDING: "pending",
	IN_REVIEW: "info",
	VENDOR_SUBMITTED: "info",
	THCM_SUBMITTED: "info",
	THCM_APPROVED: "success",
	EXTERNAL_ACCEPTED: "success",
	// Medical (guest / ex-employee)
	AWAITING_EX_EMPLOYEE: "pending",
	DELAYED: "warning",
	// EPC reports / generation
	CLARIFY_REPORT: "warning",
	GENERATING: "info",
	QUEUED: "info",
	READY: "success",
	GENERATION_FAILED: "danger",
	SUCCESSFUL: "success",
	PARTIALLY_SUCCESSFUL: "warning",
	UNSUCCESSFUL: "danger",
	// CRF orders / stock
	OPEN: "info",
	REQUESTED: "info",
	ORDERED: "success",
	AVAILABLE: "success",
	DEBITED: "info",
	PARTIAL: "warning",
	STOCK_SHORTFALL: "warning",
	OUT_OF_STOCK: "danger",
	STOCK_CHECK_FAILED: "danger",
	ORDER_FAILED: "danger",
	UNKNOWN_SKU: "danger",
	REMOVED: "neutral",
	// Users / workflow
	BLOCKED: "danger",
	SKIPPED: "neutral",

	// Inactive / historical
	DRAFT: "neutral", // was amber: a draft is not a warning
	CLOSED: "neutral",
	EPC_CLOSED: "neutral",
	SUPERSEDED: "neutral",
	INACTIVE: "neutral",
	DISABLED: "neutral",
};

/** Variant names consumers pass to <Badge variant="…"> → tone. */
const VARIANT_TONES: Record<string, StatusTone> = {
	BRAND: "brand",
	PRIMARY: "brand",
	SUCCESS: "success",
	ACTIVE: "success",
	PASSED: "success",
	DANGER: "danger",
	ERROR: "danger",
	FAILED: "danger",
	WARNING: "warning",
	PENDING: "pending",
	INFO: "info",
	NEUTRAL: "neutral",
	INACTIVE: "neutral",
	DISABLE: "neutral",
	DISABLED: "neutral",
};

export const resolveStatusTone = (status?: string | null): StatusTone | undefined =>
	STATUS_TONES[normalizeStatusKey(status)];

export const resolveVariantTone = (variant?: string | null): StatusTone | undefined =>
	VARIANT_TONES[normalizeStatusKey(variant)];

/* ------------------------------------------------------------------------ */
/* Labels                                                                   */
/* ------------------------------------------------------------------------ */

const ACRONYMS = new Set(["EPC", "EPF", "CRF", "CPP", "THCM", "GST", "PO", "PAN", "MSME", "SKU"]);

/** Labels that are not plain title case of the key. */
const LABEL_OVERRIDES: Record<string, string> = {
	CLARIFY: "Clarification Requested",
	EPC_CLOSED: "Closed",
	THCM_CLARIFICATION_REQUESTED: "Clarification Requested",
	ACCEPT_AND_CLOSE: "Accepted and Closed",
	CANCELED: "Cancelled",
	SENT_FOR_APPROVAL: "Sent for Approval",
	AWAITING_EX_EMPLOYEE: "Awaiting Ex-Employee",
};

/** "REPORT_CLARIFICATION_REQUESTED" → "Report Clarification Requested". */
export const formatStatusLabel = (status?: string | null): string => {
	const key = normalizeStatusKey(status).replace(/_ACTION$/, "");
	if (!key) return "";

	return (
		LABEL_OVERRIDES[key] ??
		key
			.split("_")
			.filter(Boolean)
			.map((word) =>
				ACRONYMS.has(word) ? word : word.charAt(0) + word.slice(1).toLowerCase(),
			)
			.join(" ")
	);
};

/** CSS class per tone (defined in components.css). */
export const TONE_BADGE_CLASS: Record<StatusTone, string> = {
	success: "badge-success",
	danger: "badge-danger",
	warning: "badge-warning",
	pending: "badge-pending",
	info: "badge-info",
	neutral: "badge-neutral",
	brand: "badge-brand",
};
