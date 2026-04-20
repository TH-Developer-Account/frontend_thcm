import type {
  CreateWorkflowPayload,
  WorkflowBasics,
  WorkflowStage,
  WorkflowCard,
  WorkFlowTemplate,
  ApprovalRule,
  StrategyType,
} from "../types/workflow.types";

export const buildWorkflowPayload = (
  basics: WorkflowBasics,
  stages: WorkflowStage[],
  workspaceId: string,
): CreateWorkflowPayload => {
  return {
    name: basics.name.trim(),
    appId: basics.app,
    workspaceId,
    isActive: basics.isActive,
    description: basics.description,
    metaData_1: "",
    metaData_2: "",
    metaData_3: "",
    stages: stages.map((stage) => {
      const baseStage = {
        name: stage.name,
        stageOrder: stage.stageOrder,
        strategy: stage.strategy,
        approverIds: stage.approvers.map((approver) => approver.id),
      };

      if (stage.strategy === "SOME") {
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

  for (const stage of stages) {
    if (!stage.approvers.length) {
      return `Stage ${stage.stageOrder} must have at least one approver`;
    }

    if (stage.strategy === "SOME") {
      const quorum = Number(stage.minApprovals || 0);
      if (quorum < 1) {
        return `Stage ${stage.stageOrder} must have at least 1 approver!`;
      }
      if (quorum > stage.approvers.length) {
        return `Stage ${stage.stageOrder} quorum cannot exceed approver count`;
      }
    }
  }

  return null;
};

function deriveStrategy(
  minApprovals: unknown,
  totalApprovers: number,
): StrategyType {
  if (minApprovals === 1) return "ANY";
  if (minApprovals === totalApprovers) return "ALL";
  return "SOME";
}

export const updateStageField = <K extends keyof WorkflowStage>(
  stages: WorkflowStage[],
  stageId: string,
  key: K,
  value: WorkflowStage[K],
): WorkflowStage[] => {
  let strategy = "All" as ApprovalRule;

  return stages.map((stage) => {
    if (key === "minApprovals") {
      strategy = deriveStrategy(value, stage.approvers.length) as ApprovalRule;
    }
    return stage.id === stageId ? { ...stage, [key]: value, strategy } : stage;
  });
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
    id: workflow.id,
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
    workflowUsers: workflow.workFlowUsers.map((each) => ({
      id: each.user.id,
    })),
  }));
};
