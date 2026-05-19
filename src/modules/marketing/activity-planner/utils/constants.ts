import type { ThreeWayOption } from "../../../../components/common/ThreeWayToggle";

export const ACTIVITY_PLANNER_ROUTES = {
	list: "/marketing/activity-planner",
	create: "/marketing/activity-planner/create",
	detail: (epcId: string) => `/marketing/activity-planner/${epcId}`,
	edit: (epcId: string) => `/marketing/activity-planner/${epcId}/edit`,
	crf: (epcId: string) => `/marketing/activity-planner/${epcId}/crf`,
	epf: (epcId: string) => `/marketing/activity-planner/${epcId}/epf`,
};

export const PRODUCT_TYPES = {
	CRF: "CRF",
	EPF: "EPF",
} as const;

export const EVENT_OVERHEAD_CATEGORY = "EVENT_OVERHEAD";

export const EDITING_SECTIONS = {
	EPC: "epc",
	CRF: "crf",
	EPF: "epf",
} as const;

export type EditingSection =
	| (typeof EDITING_SECTIONS)[keyof typeof EDITING_SECTIONS]
	| null;

export const status = {
	RECOMMENDED: "Recommended",
	PENDING: "Pending",
	SENT_BACK: "Sent Back",
	REPORT_SUBMITTED: "Report Submitted",
	APPROVED: "Approved",
	SUBMITTED: "Submitted",
	CANCELLED: "Cancelled",
	COMPLETED: "Completed",
} as const;

export type EpcListFilter = "createdByMe" | "pendingOnMe" | "approvedByMe";

export const epcListFilterOptions = [
	{
		value: "pendingOnMe",
		label: "Pending on me",
	},
	{
		value: "createdByMe",
		label: "Created by me",
	},
	{
		value: "approvedByMe",
		label: "Approvals by me",
	},
] as const satisfies readonly [
	ThreeWayOption<EpcListFilter>,
	ThreeWayOption<EpcListFilter>,
	ThreeWayOption<EpcListFilter>,
];
