import type { ThreeWayOption } from "../../../../components/common/ThreeWayToggle";

import { Bold, Italic, Code, List } from "lucide-react";
import type { FormatType } from "../types/workflow.types";
import type React from "react";
import type { FilterOption } from "../../../../components/common/FilterDropdown";
import type { EpcFilters } from "../types/epc.types";

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
export const EPC_STATUS_OPTIONS: FilterOption<string>[] = [
	{ label: "Submitted", value: "submitted" },
	{ label: "Pending", value: "pending" },
	{ label: "In Progress", value: "IN_PROGRESS" },
	{ label: "Approved", value: "approved" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Clarified", value: "clarified" },
	{ label: "Cancelled", value: "cancelled" },
];

// ✅ new — hardcoded fallback, overridden by API if available
export const EPC_ZONE_OPTIONS = [
	{ value: "abf996e0-e717-4b22-813c-1708b3d2865d", label: "Central" },
	{ value: "a0a70e6e-d3c6-49c9-ab79-22370b5727d0", label: "Corporate" },
	{ value: "743cae95-d49e-4903-81e8-1dbe33e46d6f", label: "East" },
	{ value: "c38d3d00-3325-4660-b3e5-4a35ccba640a", label: "Exports" },
	{ value: "3e67390c-46da-4aa6-8f3c-8e6ac8eed027", label: "North" },
	{ value: "3898b0e8-e41a-4a42-969c-aac6d8b406c5", label: "South-1" },
	{ value: "8509a210-ef6a-4293-9bd5-7e0159dae3fb", label: "South-2" },
	{ value: "d0beefb9-a114-46dd-a4de-9fbadc2344bf", label: "West" },
];

export const EPC_EVENT_TYPE_OPTIONS = [
	{
		value: "96ceaf5f-4cc1-49e4-afbc-761c8fb61f96",
		label: "Customer Meet - Big (Above 50+ customers)",
	},
	{
		value: "3f5f87e6-1b4a-4196-afb7-34e6fb3d9468",
		label: "Customer Meet - Small",
	},
	{ value: "f994b754-d219-4b22-bc26-f4686b5a4e21", label: "KA Customer Meet" },
	{ value: "24801190-9070-4f89-a61e-9667c4e4143c", label: "Application Study" },
	{ value: "c4aa6574-0152-4747-839b-1e7d3fefbbea", label: "Roadshow" },
	{ value: "cf38d66b-ffbb-4c76-9cb1-e5f59f545056", label: "Demo-in-Dirt" },
	{
		value: "78a9bac2-84f5-4c88-a97f-47064d5bb436",
		label: "Try & Buy offer for Machines",
	},
	{
		value: "9c81a58e-d8f6-4489-8b7b-a794b06bb76a",
		label: "Presentation to Govt. Bodies & Municipalities",
	},
	{ value: "41d05bab-97f0-41e1-a7eb-ec0a63638358", label: "Financier Meet" },
	{
		value: "6962b62b-6dda-49e8-88b5-5a259437c9a1",
		label: "Customer Plant Visit",
	},
	{ value: "cb800e39-f96e-4ff1-86c6-3ead1c9d7b14", label: "Loan Mela" },
	{ value: "e86a36df-672d-43ed-be22-b7bbd3eeb64e", label: "Product Launch" },
	{ value: "0e3a79db-ec5e-4f0f-b500-1a9aa1bfda9d", label: "Newspaper Advt." },
	{
		value: "6b9dd867-bcde-4dc9-841e-c473f708a61e",
		label: "Exhibitions & Fairs",
	},
	{
		value: "48ddd0af-54c3-48a4-8873-127a2c232ed1",
		label: "Hoardings/Glow Sign Boards",
	},
	{ value: "3d61bb05-22e1-4cf2-906d-61ffaf3d8ddc", label: "Others - Sales" },
	{ value: "57d93673-8b15-47e0-9a02-1aa5d2e3d050", label: "Operator Training" },
	{ value: "dce06f7c-041a-4630-bb0b-735a4234cbdf", label: "Operator Meet" },
	{
		value: "bf0856b9-f6e3-4006-8d07-0525f103c51c",
		label: "Training to Customer Staff",
	},
	{ value: "225019c9-65f8-413d-9ef0-a69cabd1e385", label: "Service Campaign" },
	{
		value: "cc3b0187-4077-4f8c-b495-a37973417cf0",
		label: "Competition Product Performance - Service",
	},
	{ value: "301aed82-48e8-4c0f-8f06-95dc1d2db457", label: "Others - Service" },
	{ value: "3d85c709-e261-48b3-b9a1-02fd44542062", label: "Parts Mela" },
	{
		value: "c6cab0ab-02f9-42e9-8913-128cc7938012",
		label: "Try & Buy offer for Attachments",
	},
	{ value: "0e65fdb0-5d07-4b4b-bb2e-1c8266de66bf", label: "Others - Spares" },
	{ value: "c8bc9c8d-1547-4ec1-82e1-85a7eb3def84", label: "Key Handing Over" },
	{
		value: "7f7c58e2-99bd-4792-ad53-5b429f034dbc",
		label: "Marketing HO Expense",
	},
];
export const EMPTY_EPC_FILTERS: EpcFilters = {
	status: [],
	zone: [],
	eventType: [],
	eventDateFrom: "",
	eventDateTo: "",
	createdDate: "",
};
