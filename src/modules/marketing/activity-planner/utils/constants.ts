import type { ThreeWayOption } from "../../../../components/common/ThreeWayToggle";

import {
	Bold,
	Italic,
	Code,
	List,
	ClipboardCheck,
	FileUser,
	UserRoundCheck,
	type LucideIcon,
} from "lucide-react";
import type { FormatType } from "../types/workflow.types";
import type { EpcFilters } from "../types/epc.types";
import {
	createActivityActionOptions,
	createEntityStatusOptions,
} from "./statusConfig";

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
	PENDING: "Pending",
	REPORT_SUBMITTED: "Report Submitted",
	APPROVED: "Approved",
	SUBMITTED: "Submitted",
	CANCELLED: "Cancelled",
	COMPLETED: "Completed",
	CONDUCTED: "Conducted",
	NOT_CONDUCTED: "Cancelled",
	VALIDATED: "Validated",
	CLARIFIED: "Clarified",
	IN_PROGRESS: "In Progress",
	DEVIATION_IN_PROGRESS: "Deviated",
	CLARIFY_REPORT: "Report Clarified",
	CLOSED: "Closed",
} as const;

export type EpcListFilter = "createdByMe" | "pendingOnMe" | "approvedByMe";

export const epcListFilterOptions = [
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		Icon: ClipboardCheck,
	},
	{
		value: "createdByMe",
		label: "Created by me",
		shortLabel: "Created",
		Icon: FileUser,
	},
	{
		value: "approvedByMe",
		label: "Approvals by me",
		shortLabel: "Approvals",
		Icon: UserRoundCheck,
	},
] as const satisfies readonly [
	ThreeWayOption<EpcListFilter>,
	ThreeWayOption<EpcListFilter>,
	ThreeWayOption<EpcListFilter>,
];

export const EMOJIS = [
	"👍",
	"❤️",
	"😊",
	"🎉",
	"✅",
	"🔥",
	"👏",
	"💡",
	"⚠️",
	"📎",
	"📋",
	"🔍",
	"💬",
	"📌",
	"🚀",
	"⭐",
	"✨",
	"🙏",
	"👀",
	"💯",
	"🤔",
	"😅",
	"🙌",
	"📊",
	"📝",
	"🔗",
	"✔️",
	"❌",
	"⏰",
	"📅",
];
type FormatAction = {
	icon: LucideIcon;
	fmt: FormatType;
	title: string;
};

export const FORMAT_ACTIONS = [
	{ icon: Bold, fmt: "bold", title: "Bold" },
	{ icon: Italic, fmt: "italic", title: "Italic" },
	{ icon: Code, fmt: "code", title: "Inline code" },
	{ icon: List, fmt: "bullet", title: "Bullet list" },
] satisfies FormatAction[];

export const FORMAT_WRAP: Record<FormatType, (sel: string) => string> = {
	bold: (sel) => (sel ? `**${sel}**` : "****"),
	italic: (sel) => (sel ? `_${sel}_` : "__"),
	code: (sel) => (sel ? `\`${sel}\`` : "``"),
	bullet: (sel) => `\n- ${sel || ""}`,
};

export const FORMAT_CURSOR_OFFSET: Record<FormatType, number> = {
	bold: 2,
	italic: 1,
	code: 1,
	bullet: 3,
};

export const EMPTY_EPC_FILTERS: EpcFilters = {
	status: [],
	zone: [],
	eventType: [],
	eventDateFrom: "",
	eventDateTo: "",
	createdDate: "",
};

export const eventOutcomeOptions = [
	{ label: "Select..", value: "" },
	{ label: "Conducted", value: "CONDUCTED" },
	{ label: "Not Conducted", value: "CANCELLED" },
];
export const eventDeviationOptions = [
	{ label: "Select..", value: "" },
	{ label: "Required", value: "REQUIRED" },
	{ label: "Not Required", value: "NOT_REQUIRED" },
];

export const EPC_STATUSES = [
	"PENDING",
	"SUBMITTED",
	"IN_PROGRESS",
	"APPROVED",
	"REJECTED",
	"CLARIFY",
	"CONDUCTED",
	"CANCELLED",
	"COMPLETED",
	"VALIDATED",
	"REPORT_SUBMITTED",
	"REPORT_RESUBMITTED",
	"REPORT_VALIDATED",
	"REPORT_REJECTED",
	"REPORT_CLARIFICATION_REQUESTED",
	"DEVIATION_RAISED",
	"DEVIATION_IN_PROGRESS",
	"CLOSED",
	"NOT_CONDUCTED",
] as const;

export const REPORT_STATUSES = [
	"SUBMITTED",
	"VALIDATED",
	"REJECTED",
	"CLARIFICATION_REQUESTED",
] as const;

export const ACTIVITY_ACTIONS = [
	"EPC_CREATED",
	"EPC_UPDATED",
	"EPF_CREATED",
	"EPF_UPDATED",
	"CRF_CREATED",
	"CRF_UPDATED",
	"EPC_RESUBMITTED",
	"EPC_CONDUCTED",
	"EPC_CANCELLED",
	"REPORT_SUBMITTED",
	"REPORT_RESUBMITTED",
	"REPORT_VALIDATED",
	"REPORT_REJECTED",
	"REPORT_CLARIFICATION_REQUESTED",
	"EPC_CLOSED",
	"APPROVED",
	"REJECTED",
	"CLARIFY",
	"DEVIATION_RAISED",
] as const;

export type EpcStatus = (typeof EPC_STATUSES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const epcStatusOptions = createEntityStatusOptions(EPC_STATUSES);
export const reportStatusOptions = createEntityStatusOptions(REPORT_STATUSES);
export const activityActionOptions =
	createActivityActionOptions(ACTIVITY_ACTIONS);
