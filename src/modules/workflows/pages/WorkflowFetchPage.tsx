import { useCallback, useEffect, useState } from "react";

import { workflowApi } from "../api/workflow.api";
import { WorkflowEntrySection } from "../components/WorkflowEntrySection";
import { WorkflowTemplateBuilder } from "../components/WorkflowTemplateBuilder";
import { useAttachWorkflowMutation } from "../context/useWorkflowMutations";
import type {
  CreateWorkflowPayload,
  SaveMode,
  WorkflowBuilderPayload,
  WorkflowExecutionMode,
  WorkflowSummary,
  WorkflowTemplate,
} from "../types/types";
import { getFullName } from "../utils/user";
import { mapStages } from "../utils/workflow.helpers";

type ScreenState =
  | { view: "entry" }
  | {
      view: "builder";
      sourceWorkflow: WorkflowTemplate;
      initialFlowType: WorkflowExecutionMode;
      initialSaveAsTemplate: boolean;
    };

export type WorkflowFetchPageProps = {
  sourceRecordRef: string;
  recordType: string;
  onWorkflowAttached?: () => void;
};

const getCreatedWorkflowId = (value: unknown): string | null => {
  let current = value;

  for (let depth = 0; depth < 3; depth += 1) {
    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current)
    ) {
      return null;
    }

    const record = current as Record<string, unknown>;
    const id = record.id ?? record.workflowId ?? record.templateId;
    if (typeof id === "string" || typeof id === "number") {
      return String(id);
    }

    current = record.data ?? record.workflow;
  }

  return null;
};

const buildCustomTemplatePayload = (
  source: WorkflowTemplate,
  payload: WorkflowBuilderPayload,
): CreateWorkflowPayload => ({
  name: payload.templateName?.trim() || `${source.name} - Custom`,
  workspaceId: source.workspaceId ?? "",
  isActive: true,
  appId: source.appId,
  description: source.description ?? "",
  metaData_1: source.metaData_1 ?? "",
  metaData_2: source.metaData_2 ?? "",
  metaData_3: source.metaData_3 ?? "",
  stages: payload.stages.map((stage) => ({
    name: stage.name.trim(),
    stageOrder: stage.stageOrder,
    strategy: stage.strategy,
    minApprovals:
      stage.strategy === "SOME" ? Number(stage.minApprovals) || 1 : undefined,
    approverIds: stage.approvers.map((approver) => ({
      userId: approver.user.id,
      name: getFullName(approver.user),
      email: approver.user.email?.trim() ?? "",
      isExternalApprover: approver.isExternalApprover,
    })),
  })),
});

export function WorkflowFetchPage({
  sourceRecordRef,
  recordType,
  onWorkflowAttached,
}: WorkflowFetchPageProps) {
  const [screen, setScreen] = useState<ScreenState>({ view: "entry" });
  const [createdWorkflows, setCreatedWorkflows] = useState<WorkflowSummary[]>(
    [],
  );
  const [assignedWorkflows, setAssignedWorkflows] = useState<WorkflowSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [customising, setCustomising] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const attachMutation = useAttachWorkflowMutation();

  const loadWorkflows = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [created, assigned] = await Promise.all([
        workflowApi.listReusable("created", recordType),
        workflowApi.listReusable("assigned", recordType),
      ]);

      setCreatedWorkflows(created);
      setAssignedWorkflows(assigned);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [recordType]);

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  const handleAttach = async (workflow: WorkflowSummary): Promise<void> => {
    await attachMutation.mutateAsync({
      recordRef: sourceRecordRef,
      recordType,
      workflowId: workflow.id,
    });

    onWorkflowAttached?.();
  };

  const handleEditAndAttach = async (
    workflow: WorkflowSummary,
    saveMode: SaveMode,
  ): Promise<void> => {
    setCustomising(true);
    try {
      const sourceWorkflow = await workflowApi.getById(workflow.id);
      setScreen({
        view: "builder",
        sourceWorkflow,
        initialFlowType: workflow.flowType,
        initialSaveAsTemplate: saveMode === "template",
      });
    } finally {
      setCustomising(false);
    }
  };

  const handleBuilderAttach = async (
    payload: WorkflowBuilderPayload,
  ): Promise<void> => {
    if (screen.view !== "builder") return;

    if (payload.saveAsTemplate) {
      const created = await workflowApi.createUser(
        buildCustomTemplatePayload(screen.sourceWorkflow, payload),
      );
      const workflowId = getCreatedWorkflowId(created);

      if (!workflowId) {
        throw new Error("The user workflow was created without an id.");
      }

      await attachMutation.mutateAsync({
        recordRef: sourceRecordRef,
        recordType,
        workflowId,
      });
    } else {
      await attachMutation.mutateAsync({
        recordRef: sourceRecordRef,
        recordType,
        // Pass stages through unchanged — this is already the shape
        // AttachWorkflowInput.stages expects (WorkflowBuilderPayload["stages"]).
        // Previously this flattened into {order, name, approverId} per
        // approver, which silently dropped strategy/minApprovals entirely
        // (every stage's ANY/ALL/SOME rule was lost before the request
        // was even sent) and didn't match the declared type at all.
        stages: payload.stages,
        flowType: payload.flowType,
        saveAsTemplate: false,
      });
    }

    onWorkflowAttached?.();
  };

  if (loading) {
    return <div role="status">Loading workflows...</div>;
  }

  if (error) {
    return (
      <div role="alert">
        Unable to load workflows.
        <button type="button" onClick={() => void loadWorkflows()}>
          Retry
        </button>
      </div>
    );
  }

  if (screen.view === "builder") {
    return (
      <WorkflowTemplateBuilder
        sourceRecordRef={sourceRecordRef}
        initialStages={mapStages(screen.sourceWorkflow.stages)}
        initialFlowType={screen.initialFlowType}
        initialSaveAsTemplate={screen.initialSaveAsTemplate}
        onAttach={handleBuilderAttach}
        onCancel={() => setScreen({ view: "entry" })}
        disabled={attachMutation.loading}
      />
    );
  }

  return (
    <WorkflowEntrySection
      sourceRecordRef={sourceRecordRef}
      createdWorkflows={createdWorkflows}
      assignedWorkflows={assignedWorkflows}
      onAttach={handleAttach}
      onEditAndAttach={handleEditAndAttach}
      disabled={attachMutation.loading || customising}
    />
  );
}
