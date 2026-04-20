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
  path: string;
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
  path,
}: SubmitWorkflowParams): Promise<SubmitWorkflowResult> => {
  const validationError = validateWorkflow(basics, stages, workspaceId);

  if (validationError) {
    throw new Error(validationError);
  }

  const payload = buildWorkflowPayload(basics, stages, workspaceId);

  console.log("FINAL PAYLOAD JSON:", JSON.stringify(payload, null, 2));

  try {
    console.log({ path });
    const response = await ServerAxios.post(path, payload);

    return {
      data: response.data,
      message: response.data?.message || "Workflow created successfully.",
      payload,
    };
  } catch (err: unknown) {
    console.log({ err: err.response });
    throw new Error(getErrorMessage(err));
  }
};
