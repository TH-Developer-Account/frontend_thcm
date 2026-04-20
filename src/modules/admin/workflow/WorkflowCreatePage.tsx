import React from "react";
import { useParams } from "react-router-dom";
import { ServerAxios } from "../../../services/ServerAxios";
import PageSectionLayout, {
  PageSection,
} from "../../../layout/PageSectionLayout";
import WorkflowCreateHeader from "./components/WorkflowCreateHeader";
import WorkflowCreateMain from "./components/WorkflowCreateMain";
import WorkflowCreateSidebar from "./components/WorkflowCreateSidebar";
import {
  availableUsers,
  mapBasics,
  mapStages,
  api_routes,
} from "./constant/workflow.constant";
import { submitWorkflow } from "./api/workflow.api";
import {
  addStageApprover,
  removeStageApprover,
  toggleStageExpanded,
  updateStageField,
} from "./utils/workflow.helpers";
import type {
  WorkflowBasics,
  WorkflowStage,
  Approver,
} from "./types/workflow.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";

const WorkflowCreatePage = () => {
  const { user, workspaceId, isLoading } = useAuth();
  const { showToast } = useToast();
  const { id } = useParams();

  const [currentStep, setCurrentStep] = React.useState(1);
  const [basics, setBasics] = React.useState<WorkflowBasics>({
    name: "",
    app: "",
    isActive: true,
    description: "",
  });
  const [stages, setStages] = React.useState<WorkflowStage[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await ServerAxios.get(`/work-flow/${id}`);
      setBasics(mapBasics(data));
      setStages(mapStages(data.stages));
    } catch (error) {
      console.error("Error failed to fetch the work flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalApprovers = React.useMemo(
    () => stages.reduce((sum, stage) => sum + stage.approvers.length, 0),
    [stages],
  );

  const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const goBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleBasicChange = <K extends keyof WorkflowBasics>(
    key: K,
    value: WorkflowBasics[K],
  ) => {
    setBasics((prev) => ({ ...prev, [key]: value }));
  };

  const handleStageChange = <K extends keyof WorkflowStage>(
    stageId: string,
    key: K,
    value: WorkflowStage[K],
  ) => {
    console.log("called", key, value);
    setStages((prev) => updateStageField(prev, stageId, key, value));
  };

  const toggleStage = (stageId: string) => {
    setStages((prev) => toggleStageExpanded(prev, stageId));
  };

  const removeApprover = (stageId: string, approverId: string) => {
    setStages((prev) => removeStageApprover(prev, stageId, approverId));
  };

  const addApprover = (stageId: string, approver: Approver) => {
    setStages((prev) => addStageApprover(prev, stageId, approver));
  };

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      {
        id: `stage-${prev.length + 1}`,
        stageOrder: prev.length + 1,
        name: `Stage ${prev.length + 1}`,
        strategy: "ANY",
        approvers: [],
        isExpanded: true,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!workspaceId) {
      showToast({
        type: "error",
        title: "Error",
        description: "Workspace ID is missing",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await submitWorkflow({
        basics,
        stages,
        workspaceId,
        path: id
          ? `/work-flow/update/${id}`
          : api_routes.create_workflow_api_route,
      });

      showToast({
        type: "success",
        title: "Success",
        description: response.message,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Failed to create workflow";

      showToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <PageSectionLayout>
      <PageSection className="workflow-create-page-box">
        <div className="workflow-create-page">
          <WorkflowCreateHeader currentStep={currentStep} />

          <div className="workflow-create-page-header">
            <h2 className="workflow-create-page-title">
              {id ? "Update Workflow" : "Create Workflow"}
            </h2>
            <p className="workflow-create-page-subtitle">
              Define who approves what, in which order, and under what
              conditions.
            </p>
          </div>

          <div className="workflow-create-grid">
            <WorkflowCreateMain
              currentStep={currentStep}
              goNext={goNext}
              goBack={goBack}
              basics={basics}
              stages={stages}
              availableUsers={availableUsers}
              currentUserId={user?.id || ""}
              onBasicChange={handleBasicChange}
              onStageChange={handleStageChange}
              onToggleStage={toggleStage}
              onRemoveApprover={removeApprover}
              onAddApprover={addApprover}
              onAddStage={addStage}
              onSubmit={handleSubmit}
              loading={loading}
            />

            <WorkflowCreateSidebar
              module={basics.name || "--"}
              stageCount={stages.length}
              approverCount={totalApprovers}
            />
          </div>
        </div>
      </PageSection>
    </PageSectionLayout>
  );
};

export default WorkflowCreatePage;
