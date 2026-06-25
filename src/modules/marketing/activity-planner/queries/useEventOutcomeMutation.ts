import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowApi } from "../api/workflow.api";
import { eventOutcomeApi } from "../api/event.outcome.api";
import { epcKeys } from "./epc.keys";

export const usePreviewWorkflowMutation = () => {
	return useMutation({
		mutationFn: workflowApi.previewWorkflow,
	});
};

export const useSubmitDeviatedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: (payload: {
			workflowId: string;
			eventProposalId?: string;
			workspaceId?: string;
			appId?: string;
			newBudget?: string | number;
		}) => workflowApi.submitDeviationUpdatedForm(payload),
	});
};
export const useSubmitClarifiedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: (workflowId: string) =>
			workflowApi.submitClarifiedUpdatedForm(workflowId),
	});
};

export const useCloseEPC = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epcId }: { epcId: string }) =>
			eventOutcomeApi.closeEpc(epcId),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
};
