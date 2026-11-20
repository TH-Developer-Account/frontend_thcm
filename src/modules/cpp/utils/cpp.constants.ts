import { CheckCheck, FileClock, FilePen, Hourglass } from "lucide-react";

import type {
	CppConditionOption,
	CppListingTab,
	CppStatusFilter,
} from "../types/cpp.types";

/**
 * Known request statuses. The server stores status as a plain string, so a new
 * status = one line here + one label below; nothing else has to change.
 * DRAFT -> IN_PROGRESS -> (CLARIFICATION_REQUESTED) -> PRICE_FEEDING -> COMPLETED
 */
export const CPP_STATUS = {
	DRAFT: "DRAFT",
	IN_PROGRESS: "IN_PROGRESS",
	CLARIFICATION_REQUESTED: "CLARIFICATION_REQUESTED",
	PRICE_FEEDING: "PRICE_FEEDING",
	COMPLETED: "COMPLETED",
} as const;

export const CPP_STATUS_LABELS: Record<string, string> = {
	[CPP_STATUS.DRAFT]: "Draft",
	[CPP_STATUS.IN_PROGRESS]: "In Progress",
	[CPP_STATUS.CLARIFICATION_REQUESTED]: "Clarification Requested",
	[CPP_STATUS.PRICE_FEEDING]: "Price Feeding",
	[CPP_STATUS.COMPLETED]: "Completed",
};

/** Label for any status, including ones this build does not know yet. */
export const getCppStatusLabel = (status: string): string =>
	CPP_STATUS_LABELS[status] ?? status.replace(/_/g, " ");

export const CPP_CATEGORY_LABELS: Record<string, string> = {
	CFM: "Casting Forging & Machining (CFM)",
	SM: "Sheet Metal (SM)",
	FAB: "Fabrication (FAB)",
	DOMP: "Domastic Proprietory (DOMP)",
	ERH: "Electrical Electronics Rubber Hoses and Pipes (ERH)",
	Indirect: "Indirect",
	IMPORT_HCM: "Import HCM",
	IMPORT_NON_HCM: "Import NON HCM",
	SPARES: "Spare Parts (Spares)",
	STEEL: "Steel",
};

export const CPP_PLANTS: Record<string, string> = {
	DWD: "DWD",
	KGP: "KGP",
	Spares: "Spares",
};

/* ------------------- dropdown options (frontend for now) ------------------ */
// Swap these for master-data API calls later; the form only needs
// { label, value } pairs, so nothing else changes.

export const CPP_CATEGORY_OPTIONS = Object.entries(CPP_CATEGORY_LABELS).map(
	([value, label]) => ({ value, label }),
);

export const CPP_PLANT_OPTIONS = Object.entries(CPP_PLANTS).map(
	([value, label]) => ({ value, label }),
);

/** Codes follow the structure decisions (D17): STANDARD / SUBCONTRACTING. */
export const CPP_PRICE_TYPE_OPTIONS = [
	{ value: "STANDARD", label: "Standard" },
	{ value: "SUBCONTRACTING", label: "Subcontracting (MASOP)" },
];

/**
 * "Conditions" = the nine sheets of the CPP approval-flow workbook.
 * `group` limits which conditions a category can pick.
 * `partBasis` / `amountBasis` say which values the approval bands read, so the
 * purchasing step only asks for what the chosen condition needs.
 */
export const CPP_CONDITIONS: CppConditionOption[] = [
	{
		value: "FIRST_TIME_REGULAR",
		label: "First time & Regular Purchase",
		sheet: "1.First time & Regular Purchase",
		group: "DIRECT",
		partBasis: "PART_VALUE",
		amountBasis: "ANNUALISED_VALUE",
	},
	{
		value: "PRICE_CHANGE",
		label: "Price Change",
		sheet: "2 .Price Change",
		group: "DIRECT",
		partBasis: "VARIATION_PCT",
		amountBasis: "ANNUALISED_IMPACT",
	},
	{
		value: "STEEL_COMMODITY",
		label: "Steel Commodity Price Change",
		sheet: "3. Steel Commodity Price Change",
		group: "DIRECT",
		partBasis: null,
		amountBasis: "ACTUAL_IMPACT",
	},
	{
		value: "EMERGENCY_ONETIME",
		label: "Emergency Onetime Purchase",
		sheet: "4. Emergency Onetime Purchase",
		group: "DIRECT",
		partBasis: null,
		amountBasis: "ANNUALISED_VALUE",
	},
	{
		value: "PROTOTYPE",
		label: "Prototype Development",
		sheet: "5. Prototype Development",
		group: "DIRECT",
		partBasis: "PART_VALUE",
		amountBasis: "ANNUALISED_VALUE",
	},
	{
		value: "FIRST_TIME_INDIRECT",
		label: "First time Indirect Material",
		sheet: "6. First time Indirect Material",
		group: "INDIRECT",
		partBasis: null,
		amountBasis: "ANNUALISED_VALUE",
	},
	{
		value: "PRICE_VARIATION_INDIRECT",
		label: "Price Variation Indirect",
		sheet: "7. Price Variation Indirect",
		group: "INDIRECT",
		partBasis: null,
		amountBasis: "ANNUALISED_IMPACT",
	},
	{
		value: "ONETIME_INDIRECT",
		label: "One Time Purchase of Indirect",
		sheet: "8.One Time Purchase of indirect",
		group: "INDIRECT",
		partBasis: null,
		amountBasis: "ANNUALISED_VALUE",
	},
	{
		value: "CRUDE_OIL",
		label: "Crude Oil",
		sheet: "9. Crude Oil",
		group: "INDIRECT",
		partBasis: null,
		amountBasis: "ANNUALISED_IMPACT",
	},
];

export const CPP_PART_BASIS_LABELS = {
	PART_VALUE: "Highest value per part (₹)",
	VARIATION_PCT: "Highest price variation (%)",
} as const;

export const CPP_AMOUNT_BASIS_LABELS = {
	ANNUALISED_VALUE: "Annualised value (₹)",
	ANNUALISED_IMPACT: "Annualised impact (₹)",
	ACTUAL_IMPACT: "Actual impact (₹)",
} as const;

/**
 * Listing tabs, same idea as the medical claim listing:
 *   My requests / Drafts      -> requests I created
 *   Pending on me / Approved by me -> other people's requests where I am an approver
 */
export const CPP_LISTING_FILTER_TABS = [
	{
		value: "myRequests",
		label: "My requests",
		shortLabel: "Mine",
		tooltipLabel: "All CPP requests I created",
		Icon: FileClock,
	},
	{
		value: "drafts",
		label: "Drafts",
		shortLabel: "Drafts",
		tooltipLabel: "CPP requests I have saved but not submitted",
		Icon: FilePen,
	},
	{
		value: "pendingOnMe",
		label: "Pending on me",
		shortLabel: "Pending",
		tooltipLabel: "CPP requests waiting for my approval",
		Icon: Hourglass,
	},
	{
		value: "approvedByMe",
		label: "Approved by me",
		shortLabel: "Approved",
		tooltipLabel: "CPP requests I have approved",
		Icon: CheckCheck,
	},
] as const satisfies ReadonlyArray<{
	value: CppListingTab;
	label: string;
	shortLabel: string;
	tooltipLabel: string;
	Icon: typeof FilePen;
}>;

export type CppStatusOption = { label: string; value: CppStatusFilter };

export const getCppStatusOptionsForTab = (
	tab: CppListingTab,
): CppStatusOption[] => {
	// Drafts have no status to filter; the approver tabs are already narrowed by
	// the approval itself (waiting on me / approved by me).
	if (tab !== "myRequests") return [];
	// Draft has its own tab, so "My requests" filters only the submitted statuses.
	const statuses = Object.keys(CPP_STATUS_LABELS).filter(
		(status) => status !== CPP_STATUS.DRAFT,
	);
	return [
		{ label: "All statuses", value: "all" },
		...statuses.map((value) => ({ label: CPP_STATUS_LABELS[value], value })),
	];
};

export const DEFAULT_CPP_TAB: CppListingTab = "myRequests";
export const CPP_LISTING_TABS: CppListingTab[] = [
	"myRequests",
	"drafts",
	"pendingOnMe",
	"approvedByMe",
];

/** Empty-table text per tab. */
export const CPP_EMPTY_DESCRIPTIONS: Record<CppListingTab, string> = {
	myRequests: "You have not created any CPP requests yet.",
	drafts: "You have no saved drafts.",
	pendingOnMe: "No CPP requests are waiting for your approval.",
	approvedByMe: "You have not approved any CPP requests yet.",
};
