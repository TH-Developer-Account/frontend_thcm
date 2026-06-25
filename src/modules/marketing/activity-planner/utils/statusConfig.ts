export type StatusOption<T extends string = string> = {
	label: string;
	value: T;
};

type StatusConfigItem = {
	label: string;
};

export const ENTITY_STATUS_CONFIG = {
	PENDING: {
		label: "Pending",
	},
	SUBMITTED: {
		label: "Submitted",
	},
	IN_PROGRESS: {
		label: "In Progress",
	},
	APPROVED: {
		label: "Approved",
	},
	REJECTED: {
		label: "Rejected",
	},
	CLARIFY: {
		label: "Clarification Requested",
	},
	CLARIFIED: {
		label: "Clarified",
	},
	CONDUCTED: {
		label: "Conducted",
	},
	CANCELLED: {
		label: "Cancelled",
	},
	COMPLETED: {
		label: "Completed",
	},
	VALIDATED: {
		label: "Validated",
	},
	REPORT_SUBMITTED: {
		label: "Report Submitted",
	},
	REPORT_RESUBMITTED: {
		label: "Report Resubmitted",
	},
	REPORT_VALIDATED: {
		label: "Report Validated",
	},
	REPORT_REJECTED: {
		label: "Report Rejected",
	},
	CLARIFICATION_REQUESTED: {
		label: "Clarification Requested",
	},
	REPORT_CLARIFICATION_REQUESTED: {
		label: "Report Clarification Requested",
	},
	DEVIATION_RAISED: {
		label: "Deviation Raised",
	},
	DEVIATION_IN_PROGRESS: {
		label: "Deviation In Progress",
	},
	CLOSED: {
		label: "Closed",
	},
	EPC_CLOSED: {
		label: "Closed",
	},
	NOT_CONDUCTED: {
		label: "Not Conducted",
	},
	SUPERSEDED: {
		label: "Superseded",
	},
} as const satisfies Record<string, StatusConfigItem>;

export const ACTIVITY_ACTION_CONFIG = {
	EPC_CREATED: {
		label: "EPC Created",
	},
	EPC_UPDATED: {
		label: "EPC Updated",
	},
	EPF_CREATED: {
		label: "EPF Created",
	},
	EPF_UPDATED: {
		label: "EPF Updated",
	},
	CRF_CREATED: {
		label: "CRF Created",
	},
	CRF_UPDATED: {
		label: "CRF Updated",
	},
	EPC_RESUBMITTED: {
		label: "EPC Resubmitted",
	},
	EPC_CONDUCTED: {
		label: "EPC Conducted",
	},
	EPC_CANCELLED: {
		label: "EPC Cancelled",
	},
	REPORT_SUBMITTED: {
		label: "Report Submitted",
	},
	REPORT_RESUBMITTED: {
		label: "Report Resubmitted",
	},
	REPORT_VALIDATED: {
		label: "Report Validated",
	},
	REPORT_REJECTED: {
		label: "Report Rejected",
	},
	REPORT_CLARIFICATION_REQUESTED: {
		label: "Report Clarification Requested",
	},
	EPC_CLOSED: {
		label: "EPC Closed",
	},
	APPROVED: {
		label: "Approved",
	},
	REJECTED: {
		label: "Rejected",
	},
	CLARIFY: {
		label: "Clarification Requested",
	},
	DEVIATION_RAISED: {
		label: "Deviation Raised",
	},
	COMMENT: {
		label: "Comment",
	},
	CREATOR_COMMENT: {
		label: "Creator Comment",
	},
} as const satisfies Record<string, StatusConfigItem>;

export type EntityStatus = keyof typeof ENTITY_STATUS_CONFIG;
export type ActivityAction = keyof typeof ACTIVITY_ACTION_CONFIG;

const normalizeKey = (value?: string | null) =>
	String(value ?? "")
		.trim()
		.toUpperCase();

const toTitleCase = (value: string) =>
	value
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

export const getEntityStatusLabel = (status?: string | null) => {
	const key = normalizeKey(status);

	return (
		ENTITY_STATUS_CONFIG[key as EntityStatus]?.label || toTitleCase(key || "-")
	);
};

export const getActivityActionLabel = (action?: string | null) => {
	const key = normalizeKey(action);

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
