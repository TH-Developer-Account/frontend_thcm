// utils/importConstants.ts
export const ACTIVITY_PLANNER_IMPORT_HEADERS = [
	"Activity Name",
	"Activity Type",
	"Start Date",
	"End Date",
	"Budget (INR)",
	"Dealer Code",
	"Region",
	"Remarks",
] as const;

export type ActivityPlannerImportHeader =
	(typeof ACTIVITY_PLANNER_IMPORT_HEADERS)[number];
