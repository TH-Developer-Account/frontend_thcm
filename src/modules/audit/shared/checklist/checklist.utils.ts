import type { ChecklistCardProps } from "./ChecklistCard";

export interface ChecklistLibrarySummaryCard {
	id: string;
	label: string;
	value: number;
}

/**
 * Computed from whatever templates the caller passed in — never hardcoded
 * per module, so Dealer Audit and Factory Audit each get correct numbers
 * for their own library without a separate constants file.
 */
export const deriveChecklistLibrarySummary = (
	templates: readonly ChecklistCardProps[],
): ChecklistLibrarySummaryCard[] => [
	{
		id: "active",
		label: "Published templates",
		value: templates.filter((t) => t.status === "published").length,
	},
	{
		id: "sections",
		label: "Total sections",
		value: templates.reduce((sum, t) => sum + t.sectionCount, 0),
	},
	{
		id: "points",
		label: "Inspection points",
		value: templates.reduce((sum, t) => sum + t.pointCount, 0),
	},
	{
		id: "drafts",
		label: "Drafts in progress",
		value: templates.filter((t) => t.status === "draft").length,
	},
];
