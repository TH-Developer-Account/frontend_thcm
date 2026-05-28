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
	{ api: "COMPLETED", label: "Completed" },
	{ api: "CONDUCTED", label: "Conducted" },
	{ api: "REPORT_SUBMITTED", label: "Report Submitted" },
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
	["SENT_BACK", "CANCELLED"].includes(s.api),
);

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export type LineItemOption = {
	id?: string;
	value: string;
	label: string;
	particular: string;
	description: string | null;
	category?: string;
	partNumber?: string;
	// default pricing flow
	rate?: number;
	quantity?: number;
	total?: number;

	// artwork flow
	width?: number;
	height?: number;
	unit?: string;
};
