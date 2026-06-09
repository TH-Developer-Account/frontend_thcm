import { useMutation } from "@tanstack/react-query";
import { workflowApi } from "../api/workflow.api";

export const usePreviewWorkflowMutation = () => {
	return useMutation({
		mutationFn: workflowApi.previewWorkflow,
	});
};

export const useSubmitDeviatedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: (workflowId: string) =>
			workflowApi.submitDeviationUpdatedForm(workflowId),
	});
};

export const useSubmitClarifiedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: (workflowId: string) =>
			workflowApi.submitClarifiedUpdatedForm(workflowId),
	});
};
