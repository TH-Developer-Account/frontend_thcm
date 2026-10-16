// utils/constant.ts
// Activity Planner constants: routes, filters, options, comment formatting,
// status lists and line-item column presets.
import {
	Bold,
	ClipboardCheck,
	ClipboardList,
	Code,
	Italic,
	List,
	ListFilter,
	type LucideIcon,
} from "lucide-react";

import type { ColumnConfig, EpcFilters } from "../types/epc.types";
import {
	createActivityActionOptions,
	createEntityStatusOptions,
} from "./status";

/* ========================================================================== */
/*                                   Routes                                   */
/* ========================================================================== */

export const epc_api_routes = {
	epc_listing_route: "/epc",
};

// utils/constant.ts
// Keep in sync with routes/marketingRoutes.tsx.
export const ACTIVITY_PLANNER_ROUTES = {
	list: "/marketing/activity-planner/listing",
	create: "/marketing/activity-planner/create",
	/** Read-only EPC detail page (ActivityPlannerPage). */
	detail: (epcId: string) => `/marketing/activity-planner/${epcId}`,
	/** EPC → CRF → EPF stepper. `start` only changes the page title. */
	addForms: (epcId: string, start?: "crf" | "epf") =>
		`/marketing/activity-planner/${epcId}/add-forms${start ? `?start=${start}` : ""}`,
};

/* ========================================================================== */
/*                          Products / sections / CRF                         */
/* ========================================================================== */

export const CRF_CATEGORIES = [
	{ title: "Printed Materials", value: "PRINTED_MATERIAL" },
	{ title: "Souvenirs", value: "SOUVENIR" },
	{ title: "Artworks", value: "ARTWORK" },
];

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

/* ========================================================================== */
/*                           Line-item column presets                         */
/* ========================================================================== */

export const DEFAULT_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 3 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{ key: "rate", label: "Rate", colSpan: 1, align: "right", editable: true },
	{ key: "quantity", label: "Qty", colSpan: 1, align: "right", editable: true },
	{ key: "total", label: "Total", colSpan: 1, align: "right" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

// Overhead lines are a single proposer-entered ₹ amount, not quantity × a
// catalog rate (see epf.controller.ts's createEPF/updateEPF) — so there is
// no Qty/Total column here. The `rate` key is kept as-is (only the label
// changes) so this stays wired straight into LineItemOption.rate /
// EpfLineItemPayload's `amount: item.rate` (epf.payload.ts) without
// touching either shape.
export const OVERHEAD_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 2 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{ key: "rate", label: "Amount", colSpan: 1, align: "right", editable: true },
	{ key: "quotation", label: "File", colSpan: 3, align: "center" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

export const ARTWORK_COLUMNS: ColumnConfig[] = [
	{ key: "sno", label: "SNo", colSpan: 1 },
	{ key: "partNumber", label: "Part No.", colSpan: 2 },
	{ key: "particular", label: "Particulars", colSpan: 2 },
	{ key: "description", label: "Description", colSpan: 2, editable: true },
	{
		key: "width",
		label: "Width",
		colSpan: 1,
		align: "right",
		editable: true,
		disabled: true,
	},
	{
		key: "height",
		label: "Height",
		colSpan: 1,
		align: "right",
		editable: true,
	},
	{ key: "unit", label: "Unit", colSpan: 1, align: "right" },
	{ key: "quantity", label: "Quantity", colSpan: 1, align: "right" },
	{ key: "actions", label: "Action", colSpan: 1, align: "center" },
];

// Map category value → column preset
export const CATEGORY_COLUMNS: Record<string, ColumnConfig[]> = {
	EVENT_OVERHEAD: OVERHEAD_COLUMNS,
	ARTWORK: ARTWORK_COLUMNS,
	// add more as needed
};

/* ========================================================================== */
/*                               Listing filters                              */
/* ========================================================================== */

export type EpcListFilterValue = "createdByMe" | "pendingOnMe" | "approvedByMe";
export type EpcListFilter = "pendingOnMe" | "createdByMe" | "approvedByMe";

export const epcListFilterOptions = [
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		tooltipLabel: "View EPC requests created by me",
		Icon: ClipboardList,
	},
	{
		value: "createdByMe",
		label: "Created by me",
		shortLabel: "Created",
		tooltipLabel: "View EPC requests created by me",
		Icon: ClipboardCheck,
	},
	{
		value: "approvedByMe",
		label: "Approved by me",
		shortLabel: "Approved",
		tooltipLabel: "View EPC requests approved by me",
		Icon: ListFilter,
	},
] as const;

export const EMPTY_EPC_FILTERS: EpcFilters = {
	status: [],
	zone: [],
	eventType: [],
	eventDateFrom: "",
	eventDateTo: "",
	createdDate: "",
};

/* ========================================================================== */
/*                          Event outcome / deviation                         */
/* ========================================================================== */

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

/* ========================================================================== */
/*                          Comment editor formatting                         */
/* ========================================================================== */

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

// FormatType used to be imported from components/ui/comments/comment.types,
// but that file never exported it (a broken import — TS2305) — and nothing
// else in the project defines it either. FORMAT_ACTIONS/FORMAT_WRAP/
// FORMAT_CURSOR_OFFSET below also have no consumer anywhere (the actual
// comment editor, RichTextareaInput.tsx, only ships emoji + mention + send,
// no bold/italic/code/bullet toolbar) — this looks like scaffolding for a
// formatting toolbar that was never wired up. Defining the type locally
// here (it's only used by this file's own three exports) fixes the build
// without guessing at a shared-type home for a type nothing else needs yet.
// If/when a formatting toolbar is actually built, promote this type (and
// these three exports) to wherever that toolbar component lives.
export type FormatType = "bold" | "italic" | "code" | "bullet";

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

/* ========================================================================== */
/*                           Status lists & options                           */
/* ========================================================================== */

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
/* ------------------------------------------------------------------ */
/*                    Activity planner route paths                     */
/* ------------------------------------------------------------------ */

export const EPC_LISTING_PATH = "/marketing/activity-planner/listing";
export const EPC_LEADS_VIEW_PATH = "/marketing/activity-planner/leads/view";
export const EPC_DETAIL_PATH = (epcId: string) =>
	`/marketing/activity-planner/${epcId}`;

/** Which menu option opened the wizard ("Add CRF" / "Add EPF"). Title only. */
export type EpcWizardIntent = "epc" | "crf" | "epf";

export const EPC_FORMS_WIZARD_PATH = (epcId: string, start: EpcWizardIntent) =>
	`/marketing/activity-planner/${epcId}/add-forms?start=${start}`;
