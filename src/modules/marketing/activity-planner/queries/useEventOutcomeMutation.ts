import { useMutation } from "@tanstack/react-query";
import { workflowApi } from "../api/workflow.api";

export const usePreviewWorkflowMutation = () => {
	return useMutation({
		mutationFn: workflowApi.previewWorkflow,
	});
};
