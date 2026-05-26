import type { ThreeWayOption } from "../../../../components/common/ThreeWayToggle";

import { Bold, Italic, Code, List } from "lucide-react";
import type { FormatType } from "../types/workflow.types";
import type React from "react";
import type { EpcFilters } from "../types/epc.types";
import type { Option } from "../../../../components/FormElements/input.types";

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

export const FORMAT_ACTIONS: {
	icon: React.ElementType;
	fmt: FormatType;
	title: string;
}[] = [
	{ icon: Bold, fmt: "bold", title: "Bold" },
	{ icon: Italic, fmt: "italic", title: "Italic" },
	{ icon: Code, fmt: "code", title: "Inline code" },
	{ icon: List, fmt: "bullet", title: "Bullet list" },
];

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

// Define once, outside the component (or in constants.ts)
export const EPC_STATUS_OPTIONS: Option[] = [
	{ label: "Submitted", value: "SUBMITTED" },
	{ label: "Pending", value: "PENDING" },
	{ label: "In Progress", value: "IN_PROGRESS" },
	{ label: "Approved", value: "APPROVED" },
	{ label: "Rejected", value: "REJECTED" },
	{ label: "Clarified", value: "CLARIFIED" },
	{ label: "Cancelled", value: "CANCELLED" },
];

export const EMPTY_EPC_FILTERS: EpcFilters = {
	status: [],
	zone: [],
	eventType: [],
	eventDateFrom: "",
	eventDateTo: "",
	createdDate: "",
};
