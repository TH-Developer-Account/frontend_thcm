import type {
  CreateWorkflowPayload,
  WorkflowBasics,
  WorkflowStage,
  WorkflowCard,
  WorkflowRow,
  WorkFlowTemplate,
} from "../types/workflow.types";

export const buildWorkflowPayload = (
  basics: WorkflowBasics,
  stages: WorkflowStage[],
  workspaceId: string,
): CreateWorkflowPayload => {
  return {
    name: basics.name.trim(),
    workspaceId,
    regionId: basics.regionId,
    minBudget: Number(basics.minBudget) || 0,
    maxBudget: Number(basics.maxBudget) || 0,
    priority: Number(basics.priority) || 1,
    isActive: basics.isActive,
    stages: stages.map((stage) => {
      const baseStage = {
        stageOrder: stage.stageOrder,
        strategy: stage.strategy,
        approverIds: stage.approvers.map((approver) => approver.id),
      };

      if (stage.strategy === "QUORUM") {
        return {
          ...baseStage,
          minApprovals: Number(stage.minApprovals) || 1,
        };
      }

      return baseStage;
    }),
  };
};

export const validateWorkflow = (
  basics: WorkflowBasics,
  stages: WorkflowStage[],
  workspaceId: string,
): string | null => {
  if (!basics.name.trim()) return "Workflow name is required";
  if (!workspaceId) return "Workspace ID is missing";
  if (!basics.regionId) return "Region is required";

  if (Number(basics.minBudget) > Number(basics.maxBudget)) {
    return "Minimum budget cannot be greater than maximum budget";
  }

  for (const stage of stages) {
    if (!stage.approvers.length) {
      return `Stage ${stage.stageOrder} must have at least one approver`;
    }

    if (stage.strategy === "QUORUM") {
      const quorum = Number(stage.minApprovals || 0);
      if (quorum < 1) {
        return `Stage ${stage.stageOrder} quorum must be at least 1`;
      }
      if (quorum > stage.approvers.length) {
        return `Stage ${stage.stageOrder} quorum cannot exceed approver count`;
      }
    }
  }

  return null;
};

export const updateStageField = <K extends keyof WorkflowStage>(
  stages: WorkflowStage[],
  stageId: string,
  key: K,
  value: WorkflowStage[K],
): WorkflowStage[] => {
  return stages.map((stage) =>
    stage.id === stageId ? { ...stage, [key]: value } : stage,
  );
};

export const toggleStageExpanded = (
  stages: WorkflowStage[],
  stageId: string,
): WorkflowStage[] => {
  return stages.map((stage) =>
    stage.id === stageId ? { ...stage, isExpanded: !stage.isExpanded } : stage,
  );
};

export const removeStageApprover = (
  stages: WorkflowStage[],
  stageId: string,
  approverId: string,
): WorkflowStage[] => {
  return stages.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          approvers: stage.approvers.filter((a) => a.id !== approverId),
        }
      : stage,
  );
};

export const addStageApprover = (
  stages: WorkflowStage[],
  stageId: string,
  approver: Approver,
): WorkflowStage[] => {
  return stages.map((stage) => {
    if (stage.id !== stageId) return stage;

    const alreadyExists = stage.approvers.some((a) => a.id === approver.id);
    if (alreadyExists) return stage;

    return {
      ...stage,
      approvers: [...stage.approvers, approver],
    };
  });
};

export const mapWorkflows = (data: WorkFlowTemplate[]): WorkflowCard[] => {
  return data.map((workflow) => ({
    name: workflow.name,

    app_name: workflow.app?.name || "",

    created_by: workflow.created_by
      ? `${workflow.created_by.first_name} ${workflow.created_by.last_name}`
      : "",

    isActive: workflow.isActive,

    last_updated: workflow.updated_at,

    updated_by: workflow.updated_by
      ? `${workflow.updated_by.first_name} ${workflow.updated_by.last_name}`
      : "",
  }));
};
