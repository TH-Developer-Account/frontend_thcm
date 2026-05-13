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
