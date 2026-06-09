import { useMutation } from "@tanstack/react-query";
import { workflowApi } from "../api/workflow.api";

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
