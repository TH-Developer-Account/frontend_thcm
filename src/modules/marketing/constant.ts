import type { LineItemOption } from "./types";

export const epc_api_routes = {
	epc_listing_route: "/epc",
};

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

export const buildLineItemPayload = (
	items: LineItemOption[],
	extraPayload: Record<string, unknown>,
) => {
	return {
		...extraPayload,
		lineItems: items.map((item) => ({
			productId: item.value, // 👈 map value → productId
			quantity: item.quantity,
		})),
	};
};

export const ApproversData = [
	{
		id: 1,
		name: "Shashank Shekhar",
		email: "shashank@tatahitachi.co.in",
		designation: "Head Finance",
		type: "Proposer",
		status: "Submitted",
		timestamp: "3/28/2020 10:44 AM",
	},
	{
		id: 2,
		name: "Mc. Srinivas",
		email: "srinivas@tatahitachi.co.in",
		designation: "Planning",
		type: "Checker",
		status: "Approved",
		timestamp: "3/29/2020 01:32 PM",
	},
];
