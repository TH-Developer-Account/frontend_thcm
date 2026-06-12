// utils/status.helper.ts

export const STATUS_CONFIG = {
	PENDING: {
		label: "Pending",
		variant: "warning",
	},

	SUBMITTED: {
		label: "Submitted",
		variant: "primary",
	},

	APPROVED: {
		label: "Approved",
		variant: "success",
	},

	REJECTED: {
		label: "Rejected",
		variant: "danger",
	},

	CANCELLED: {
		label: "Cancelled",
		variant: "danger",
	},

	COMPLETED: {
		label: "Completed",
		variant: "success",
	},

	CONDUCTED: {
		label: "Conducted",
		variant: "success",
	},

	VALIDATED: {
		label: "Validated",
		variant: "success",
	},

	REPORT_VALIDATED: {
		label: "Validated",
		variant: "success",
	},

	REPORT_SUBMITTED: {
		label: "Report Submitted",
		variant: "primary",
	},

	REPORT_RESUBMITTED: {
		label: "Report resubmitted",
		variant: "primary",
	},

	CLARIFY: {
		label: "Sent Back",
		variant: "warning",
	},

	CLARIFIED: {
		label: "Clarified",
		variant: "warning",
	},

	SENT_BACK: {
		label: "Sent Back",
		variant: "warning",
	},

	CLARIFICATION_REQUESTED: {
		label: "Sent Back",
		variant: "warning",
	},

	CLARIFY_REPORT: {
		label: "Report Clarified",
		variant: "warning",
	},

	REPORT_CLARIFICATION_REQUESTED: {
		label: "Report Clarified",
		variant: "warning",
	},

	IN_PROGRESS: {
		label: "In Progress",
		variant: "primary",
	},

	DEVIATION_RAISED: {
		label: "Deviated",
		variant: "danger",
	},

	DEVIATION_PENDING: {
		label: "Deviated",
		variant: "danger",
	},

	DEVIATION_IN_PROGRESS: {
		label: "Deviated",
		variant: "danger",
	},

	CLOSED: {
		label: "Closed",
		variant: "disable",
	},

	EPC_CLOSED: {
		label: "Closed",
		variant: "disable",
	},

	NOT_CONDUCTED: {
		label: "Cancelled",
		variant: "danger",
	},
} as const;

export type ApiStatus = keyof typeof STATUS_CONFIG;

export type StatusLabel =
	(typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]["label"];

export type StatusVariant =
	(typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]["variant"];

export type GeneralStatus = StatusLabel;

export const getStatusForBadge = (
	status?: string | null,
): GeneralStatus | undefined => {
	const normalized = String(status ?? "")
		.trim()
		.toUpperCase();

	switch (normalized) {
		case "PENDING":
			return "Pending";

		case "SUBMITTED":
			return "Submitted";

		case "APPROVED":
			return "Approved";

		case "REJECTED":
			return "Rejected";

		case "CANCELLED":
			return "Cancelled";

		case "COMPLETED":
			return "Completed";

		case "CONDUCTED":
			return "Conducted";

		case "VALIDATED":
		case "REPORT_VALIDATED":
			return "Validated";

		case "REPORT_SUBMITTED":
		case "REPORT_RESUBMITTED":
			return "Report Submitted";

		case "CLARIFY":
		case "CLARIFIED":
		case "SENT_BACK":
		case "CLARIFICATION_REQUESTED":
			return "Clarified";

		case "CLARIFY_REPORT":
		case "REPORT_CLARIFICATION_REQUESTED":
			return "Report Clarified";

		case "IN_PROGRESS":
			return "In Progress";

		case "DEVIATION_IN_PROGRESS":
		case "DEVIATION_RAISED":
		case "DEVIATION_PENDING":
			return "Deviated";

		case "CLOSED":
		case "EPC_CLOSED":
			return "Closed";

		default:
			return undefined;
	}
};
