import type { EPCStatus } from "../../utils/types";

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
		"REPORT_SUBMITTED",
	].includes(s.api),
);

export const INTERRUPT_STEPS = ALL_STATUSES.filter((s) =>
	["SENT_BACK", "CANCELLED"].includes(s.api),
);

export const EPC_TO_API_STATUS: Record<EPCStatus, ApprovalApiStatus> = {
	Approved: "APPROVED",
	Recommended: "RECOMMENDED",
	Checked: "CHECKED",
	Pending: "PENDING",
	Completed: "COMPLETED",
	Submitted: "SUBMITTED",
	"Sent Back": "SENT_BACK",
	"Report Submitted": "REPORT_SUBMITTED",
	Cancelled: "CANCELLED",
};

export interface LineItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

export type LineItemOption = {
	value: string;
	label: string;
	particular: string;
	description: string | null;
	rate: number;
	quantity: number;
	category?: string;
	partNumber?: string;
	// height?: string;
	// width?: string;
	// artworkSize?: string;
};
