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
	{ api: "RECOMMENDED", label: "Recommended" },
	{ api: "CHECKED", label: "Checked" },
	{ api: "SENT_BACK", label: "Sent Back" },
	{ api: "APPROVED", label: "Approved" },
	{ api: "CANCELLED", label: "Cancelled" },
	{ api: "CLARIFY", label: "Clarified" },
	{ api: "COMPLETED", label: "Completed" },
	{ api: "CONDUCTED", label: "Conducted" },
	{ api: "REPORT_SUBMITTED", label: "Report Submitted" },
	{ api: "VALIDATED", label: "Validated" },
	{ api: "DEVIATION", label: "Deviation" },
] as const;

export type ApprovalApiStatus = (typeof ALL_STATUSES)[number]["api"];

export const BASE_STEPS = ALL_STATUSES.filter((s) =>
	["PENDING", "SUBMITTED"].includes(s.api),
);

export const SUCCESS_STEPS = ALL_STATUSES.filter((s) =>
	[
		"RECOMMENDED",
		"CHECKED",
		"APPROVED",
		"COMPLETED",
		"CONDUCTED",
		"REPORT_SUBMITTED",
	].includes(s.api),
);

export const INTERRUPT_STEPS = ALL_STATUSES.filter((s) =>
	["SENT_BACK", "CANCELLED", "CLARIFY", "DEVIATION"].includes(s.api),
);
