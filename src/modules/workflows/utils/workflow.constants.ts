import { ClipboardCheck, ClipboardList } from "lucide-react";

type AppPermission = {
	action: string;
	appId: string;
	appName: string;
};

// export interface Permission {
//   action: PermissionAction;
//   scopeType: ScopeType;
//   appKey: string;
//   moduleKey: string;
// }

export const formatApps = (data: AppPermission[]) => {
	const uniqueApps = new Map<string, { value: string; label: string }>();

	data.forEach((item) => {
		if (item.action === "read" && !uniqueApps.has(item.appId)) {
			uniqueApps.set(item.appId, {
				value: item.appId,
				label: item.appName,
			});
		}
	});

	return Array.from(uniqueApps.values());
};

export const workflowListFilterOptions = [
	{
		value: "ALL",
		label: "All workflows",
		shortLabel: "All",
		tooltipLabel: "View all workflows",
		Icon: ClipboardCheck,
	},
	{
		value: "ASSIGNED_TO_ME",
		label: "Assigned to me",
		shortLabel: "Assigned",
		tooltipLabel: "View all workflows assigned to me",
		Icon: ClipboardList,
	},
	{
		value: "CREATED_BY_ME",
		label: "Created by me",
		shortLabel: "Created",
		tooltipLabel: "View all workflows created by me",
		Icon: ClipboardCheck,
	},
] as const;
