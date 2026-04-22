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

export const mapBasics = (data: any) => ({
	id: data.id,
	name: data.name,
	description: data.description,
	workspaceId: data.workspaceId,
	app: data.appId,
	isActive: data.isActive,
	category: data.metaData_1,
	metaData_2: data.metaData_2,
	metaData_3: data.metaData_3,
});

export const mapStages = (stages: any[] = []) => {
	return [...stages]
		.sort((a, b) => a.stageOrder - b.stageOrder)
		.map((stage, index) => ({
			id: stage.id,
			name: stage.name ?? `Stage ${stage.stageOrder ?? index + 1}`,
			stageOrder: stage.stageOrder,
			strategy: stage.strategy === "QUORUM" ? "SOME" : stage.strategy,
			minApprovals: stage.minApprovals ?? 1,
			isExpanded: index === 0,
			approvers: (stage.approvers ?? []).map((a: any) => ({
				id: a.id ?? a.user?.id ?? "",
				stageId: stage.id,
				userId: a.user?.id ?? a.userId ?? "",
				user: {
					id: a.user?.id ?? a.userId ?? "",
					first_name: a.user?.first_name ?? "",
					last_name: a.user?.last_name ?? "",
					email: a.user?.email ?? "",
				},
			})),
		}));
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
