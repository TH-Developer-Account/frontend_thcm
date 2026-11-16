import { FileClock, FilePen } from "lucide-react";

import type {
	CppListingTab,
	CppStatus,
	CppStatusFilter,
} from "../types/cpp.types";

export const CPP_STATUS_LABELS: Record<CppStatus, string> = {
	DRAFT: "Draft",
	IN_PROGRESS: "In Progress",
	CLARIFICATION_REQUESTED: "Clarification Requested",
	APPROVED: "Approved",
};

/**
 * "Pending on me" / "Approved by me" tabs are added with the workflow:
 * they need the approval tables, exactly like the medical claim listing.
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
	if (tab === "drafts") return [];
	const statuses = Object.keys(CPP_STATUS_LABELS) as CppStatus[];
	return [
		{ label: "All statuses", value: "all" },
		...statuses.map((value) => ({ label: CPP_STATUS_LABELS[value], value })),
	];
};

export const DEFAULT_CPP_TAB: CppListingTab = "myRequests";
export const CPP_LISTING_TABS: CppListingTab[] = ["myRequests", "drafts"];
