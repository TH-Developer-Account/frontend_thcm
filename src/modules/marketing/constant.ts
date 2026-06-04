import type { ThreeWayOption } from "../../components/common/ThreeWayToggle";

export const epc_api_routes = {
	epc_listing_route: "/epc",
};

// export const status = {
// 	RECOMMENDED: "Recommended",
// 	PENDING: "Pending",
// 	SENT_BACK: "Sent Back",
// 	REPORT_SUBMITTED: "Report Submitted",
// 	APPROVED: "Approved",
// 	SUBMITTED: "Submitted",
// 	CANCELLED: "Cancelled",
// 	COMPLETED: "Completed",
// } as const;

export type EpcListFilterValue = "createdByMe" | "pendingOnMe" | "approvedByMe";

export const epcListFilterOptions: [
	ThreeWayOption<EpcListFilterValue>,
	ThreeWayOption<EpcListFilterValue>,
	ThreeWayOption<EpcListFilterValue>,
] = [
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
];

export const CRF_CATEGORIES = [
	{ title: "Printed Materials", value: "PRINTED_MATERIAL" },
	{ title: "Souvenirs", value: "SOUVENIR" },
	{ title: "Artworks", value: "ARTWORK" },
];
