export interface Option {
	label: string;
	value: string;
	department?: string;
	description?: string;
	code?: string;
}

export const ALL_STATUSES = [
	{ api: "PENDING", label: "Pending" },
	{ api: "SUBMITTED", label: "Submitted" },
	{ api: "APPROVED", label: "Approved" },
	{ api: "CANCELLED", label: "Cancelled" },
	{ api: "CLARIFY", label: "Clarified" },
	{ api: "COMPLETED", label: "Completed" },
	{ api: "CONDUCTED", label: "Conducted" },
	{ api: "REPORT_SUBMITTED", label: "Report Submitted" },
	{ api: "VALIDATED", label: "Validated" },
	{ api: "DEVIATION_IN_PROGRESS", label: "Deviation" },
	{ api: "CLARIFY_REPORT", label: "Report Clarified" },
] as const;

export type ApprovalApiStatus = (typeof ALL_STATUSES)[number]["api"];
