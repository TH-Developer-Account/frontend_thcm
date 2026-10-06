// utils/status.ts
// Status registry: badge config (label + variant), entity status labels,
// activity action labels and option builders.

/* ========================================================================== */
/*                                   Shared                                   */
/* ========================================================================== */

export type StatusOption<T extends string = string> = {
	label: string;
	value: T;
};

const normalizeStatus = (status?: string | null) =>
	String(status ?? "")
		.trim()
		.toUpperCase();

const toTitleCase = (status: string) =>
	status
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

/* ========================================================================== */
/*                       Badge registry (label + variant)                     */
/* ========================================================================== */

export const STATUS_VARIANTS = {
	primary: "primary",
	success: "success",
	warning: "warning",
	danger: "danger",
	disable: "disable",
	neutral: "neutral",
	passed: "passed",
	failed: "failed",
} as const;

export type StatusVariant =
	(typeof STATUS_VARIANTS)[keyof typeof STATUS_VARIANTS];

type StatusConfig = {
	label: string;
	variant: StatusVariant;
};

/**
 * Global badge registry.
 * Add every backend status here only for display purpose.
 * Do not use this list directly for filters.
 */
export const STATUS_CONFIG = {
	// General Badge statuses
	FAILED: { label: "Failed", variant: "danger" },

	// EPC / approval statuses
	PENDING: { label: "Pending", variant: "warning" },
	SUBMITTED: { label: "Submitted", variant: "primary" },
	IN_PROGRESS: { label: "In Progress", variant: "primary" },
	APPROVED: { label: "Approved", variant: "success" },
	REJECTED: { label: "Rejected", variant: "danger" },
	CLARIFY: { label: "Clarification Requested", variant: "warning" },
	CLARIFIED: { label: "Clarified", variant: "warning" },

	// EPC event lifecycle
	CONDUCTED: { label: "Conducted", variant: "success" },
	CANCELLED: { label: "Cancelled", variant: "danger" },
	NOT_CONDUCTED: { label: "Not Conducted", variant: "danger" },
	COMPLETED: { label: "Completed", variant: "success" },
	CLOSED: { label: "Closed", variant: "disable" },
	EPC_CLOSED: { label: "Closed", variant: "disable" },

	// Report statuses
	REPORT_SUBMITTED: { label: "Report Submitted", variant: "primary" },
	REPORT_RESUBMITTED: { label: "Report Resubmitted", variant: "primary" },
	REPORT_VALIDATED: { label: "Report Validated", variant: "success" },
	REPORT_REJECTED: { label: "Report Rejected", variant: "danger" },
	REPORT_CLARIFICATION_REQUESTED: {
		label: "Report Clarification Requested",
		variant: "warning",
	},

	// API report enum statuses
	VALIDATED: { label: "Validated", variant: "success" },
	CLARIFICATION_REQUESTED: {
		label: "Clarification Requested",
		variant: "warning",
	},

	// Deviation
	DEVIATION_RAISED: { label: "Deviation Raised", variant: "danger" },
	DEVIATION_IN_PROGRESS: { label: "Deviation In Progress", variant: "warning" },

	// Workflow
	SUPERSEDED: { label: "Superseded", variant: "disable" },

	// Activity log actions
	EPC_CREATED: { label: "EPC Created", variant: "primary" },
	EPC_UPDATED: { label: "EPC Updated", variant: "primary" },
	EPF_CREATED: { label: "EPF Created", variant: "primary" },
	EPF_UPDATED: { label: "EPF Updated", variant: "primary" },
	CRF_CREATED: { label: "CRF Created", variant: "primary" },
	CRF_UPDATED: { label: "CRF Updated", variant: "primary" },
	EPC_RESUBMITTED: { label: "EPC Resubmitted", variant: "primary" },
	EPC_CONDUCTED: { label: "EPC Conducted", variant: "success" },
	EPC_CANCELLED: { label: "EPC Cancelled", variant: "danger" },
	REPORT_SUBMITTED_ACTION: { label: "Report Submitted", variant: "primary" },
	REPORT_RESUBMITTED_ACTION: {
		label: "Report Resubmitted",
		variant: "primary",
	},
	REPORT_VALIDATED_ACTION: { label: "Report Validated", variant: "success" },
	REPORT_REJECTED_ACTION: { label: "Report Rejected", variant: "danger" },
	REPORT_CLARIFICATION_REQUESTED_ACTION: {
		label: "Report Clarification Requested",
		variant: "warning",
	},
} as const satisfies Record<string, StatusConfig>;

export type ApiStatus = keyof typeof STATUS_CONFIG;

export type StatusLabel =
	(typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]["label"];

export const getStatusConfig = (status?: string | null): StatusConfig => {
	const normalized = normalizeStatus(status);

	return (
		STATUS_CONFIG[normalized as ApiStatus] ?? {
			label: toTitleCase(normalized || "-"),
			variant: "neutral",
		}
	);
};

export const getStatusLabel = (status?: string | null) =>
	getStatusConfig(status).label;

export const getStatusVariant = (status?: string | null) =>
	getStatusConfig(status).variant;

export const createStatusOptions = <TStatus extends string>(
	statuses: readonly TStatus[],
) =>
	statuses.map((value) => ({
		value,
		label: getStatusLabel(value),
	}));

/* ========================================================================== */
/*                 Entity status & activity action labels (filters)           */
/* ========================================================================== */

type StatusConfigItem = {
	label: string;
};

export const ENTITY_STATUS_CONFIG = {
	PENDING: { label: "Pending" },
	SUBMITTED: { label: "Submitted" },
	IN_PROGRESS: { label: "In Progress" },
	APPROVED: { label: "Approved" },
	REJECTED: { label: "Rejected" },
	CLARIFY: { label: "Clarification Requested" },
	CLARIFIED: { label: "Clarified" },
	CONDUCTED: { label: "Conducted" },
	CANCELLED: { label: "Cancelled" },
	COMPLETED: { label: "Completed" },
	VALIDATED: { label: "Validated" },
	REPORT_SUBMITTED: { label: "Report Submitted" },
	REPORT_RESUBMITTED: { label: "Report Resubmitted" },
	REPORT_VALIDATED: { label: "Report Validated" },
	REPORT_REJECTED: { label: "Report Rejected" },
	CLARIFICATION_REQUESTED: { label: "Clarification Requested" },
	REPORT_CLARIFICATION_REQUESTED: { label: "Report Clarification Requested" },
	DEVIATION_RAISED: { label: "Deviation Raised" },
	DEVIATION_IN_PROGRESS: { label: "Deviation In Progress" },
	CLOSED: { label: "Closed" },
	EPC_CLOSED: { label: "Closed" },
	NOT_CONDUCTED: { label: "Not Conducted" },
	SUPERSEDED: { label: "Superseded" },
} as const satisfies Record<string, StatusConfigItem>;

export const ACTIVITY_ACTION_CONFIG = {
	EPC_CREATED: { label: "EPC Created" },
	EPC_UPDATED: { label: "EPC Updated" },
	EPF_CREATED: { label: "EPF Created" },
	EPF_UPDATED: { label: "EPF Updated" },
	CRF_CREATED: { label: "CRF Created" },
	CRF_UPDATED: { label: "CRF Updated" },
	EPC_RESUBMITTED: { label: "EPC Resubmitted" },
	EPC_CONDUCTED: { label: "EPC Conducted" },
	EPC_CANCELLED: { label: "EPC Cancelled" },
	REPORT_SUBMITTED: { label: "Report Submitted" },
	REPORT_RESUBMITTED: { label: "Report Resubmitted" },
	REPORT_VALIDATED: { label: "Report Validated" },
	REPORT_REJECTED: { label: "Report Rejected" },
	REPORT_CLARIFICATION_REQUESTED: { label: "Report Clarification Requested" },
	EPC_CLOSED: { label: "EPC Closed" },
	APPROVED: { label: "Approved" },
	REJECTED: { label: "Rejected" },
	CLARIFY: { label: "Clarification Requested" },
	DEVIATION_RAISED: { label: "Deviation Raised" },
	COMMENT: { label: "Comment" },
	CREATOR_COMMENT: { label: "Creator Comment" },
} as const satisfies Record<string, StatusConfigItem>;

export type EntityStatus = keyof typeof ENTITY_STATUS_CONFIG;
export type ActivityAction = keyof typeof ACTIVITY_ACTION_CONFIG;

export const getEntityStatusLabel = (status?: string | null) => {
	const key = normalizeStatus(status);

	return (
		ENTITY_STATUS_CONFIG[key as EntityStatus]?.label || toTitleCase(key || "-")
	);
};

export const getActivityActionLabel = (action?: string | null) => {
	const key = normalizeStatus(action);

	return (
		ACTIVITY_ACTION_CONFIG[key as ActivityAction]?.label ||
		toTitleCase(key || "-")
	);
};

export const createEntityStatusOptions = <T extends string>(
	statuses: readonly T[],
): StatusOption<T>[] =>
	statuses.map((value) => ({
		value,
		label: getEntityStatusLabel(value),
	}));

export const createActivityActionOptions = <T extends string>(
	actions: readonly T[],
): StatusOption<T>[] =>
	actions.map((value) => ({
		value,
		label: getActivityActionLabel(value),
	}));
