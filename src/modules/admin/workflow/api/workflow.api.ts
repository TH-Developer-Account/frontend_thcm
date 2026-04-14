import { api_routes } from "../constant/workflow.constant";
import {
	buildWorkflowPayload,
	validateWorkflow,
} from "../utils/workflow.helpers";
import type {
	CreateWorkflowPayload,
	WorkflowBasics,
	WorkflowStage,
} from "../types/workflow.types";
import { ServerAxios } from "../../../../services/ServerAxios";

type SubmitWorkflowParams = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
	workspaceId: string;
};

type SubmitWorkflowResult = {
	data: unknown;
	message: string;
	payload: CreateWorkflowPayload;
};

const getErrorMessage = (err: unknown): string => {
	if (
		err &&
		typeof err === "object" &&
		"response" in err &&
		(err as any)?.response?.data?.message
	) {
		return (err as any).response.data.message;
	}

	if (err instanceof Error) {
		return err.message;
	}

	if (typeof err === "string") {
		return err;
	}

	return "Failed to create workflow";
};

export const submitWorkflow = async ({
	basics,
	stages,
	workspaceId,
}: SubmitWorkflowParams): Promise<SubmitWorkflowResult> => {
	const validationError = validateWorkflow(basics, stages, workspaceId);

	if (validationError) {
		throw new Error(validationError);
	}

	const payload = buildWorkflowPayload(basics, stages, workspaceId);

	console.log("FINAL PAYLOAD:", payload);
	console.log("FINAL PAYLOAD JSON:", JSON.stringify(payload, null, 2));

	try {
		const response = await ServerAxios.post(
			api_routes.create_workflow_api_route,
			payload,
		);

		return {
			data: response.data,
			message: response.data?.message || "Workflow created successfully.",
			payload,
		};
	} catch (err: unknown) {
		throw new Error(getErrorMessage(err));
	}
};
