import type { WorkspacePayload } from "../../user-profile/types/profile.types";
import type { BudgetCategory } from "../types/workflow.types";

export const api_routes = {
	// other routes...
	create_workflow_api_route: "/work-flow",
	get_all_workflow_api_route: "/work-flow",
	create_assign_users_workflow_template: "work-flow/assign-profile",
};

export const formatApps = (data: WorkspacePayload) => {
	const uniqueMap = new Map();

	data.forEach((item) => {
		if (item.action === "read") {
			if (!uniqueMap.has(item.appId)) {
				uniqueMap.set(item.appId, {
					value: item.appId,
					label: item.appName,
				});
			}
		}
	});

	return Array.from(uniqueMap.values());
};

export const budgetCategories: BudgetCategory[] = [
	{
		value: "below_20k",
		label: "Below ₹20K",
		min: 0,
		max: 20000,
	},
	{
		value: "20k_3l",
		label: "₹20K – ₹3L",
		min: 20000,
		max: 300000,
	},
	{
		value: "3l_6l",
		label: "₹3L – ₹6L",
		min: 300000,
		max: 600000,
	},
	{
		value: "6l_10l",
		label: "₹6L – ₹10L",
		min: 600000,
		max: 1000000,
	},
	{
		value: "above_10l",
		label: "Above ₹10L",
		min: 1000000,
		max: null,
	},
];
