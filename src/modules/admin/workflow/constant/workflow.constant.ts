import type { WorkspacePayload } from "../../user-profile/types/profile.types";

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

	metaData_1: data.metaData_1,
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
