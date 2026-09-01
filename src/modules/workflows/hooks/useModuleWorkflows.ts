import { useQuery } from "@tanstack/react-query";

import { workflowApi } from "../api/workflow.api";
import type { WorkflowModuleListParams } from "../types/types";

export const workflowModuleKeys = {
	all: ["workflows", "module"] as const,
	list: (params: WorkflowModuleListParams) =>
		[...workflowModuleKeys.all, params] as const,
};

/**
 * Fetches workflows assigned to the current user for a specific app + module.
 * Used for modules (like medi-claim) that only support admin-assigned
 * workflows, so there's no create/attach flow here — just the listing.
 */
export function useModuleWorkflowsQuery(
	params: WorkflowModuleListParams,
	enabled = true,
) {
	return useQuery({
		queryKey: workflowModuleKeys.list(params),
		queryFn: () => workflowApi.listForModule(params),
		enabled,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});
}
