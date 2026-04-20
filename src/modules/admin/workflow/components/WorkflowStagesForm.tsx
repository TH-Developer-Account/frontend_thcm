import React from "react";
import { Plus } from "lucide-react";
import UserAsyncSelect from "../../../../components/FormElements/AsyncSelect";
import Avatar from "../../../../components/common/Avatar";
import type { WorkflowStage, Approver } from "../types/workflow.types";

type Props = {
  stages: WorkflowStage[];
  currentUserId: string;
  availableUsers: Approver[];
  onStageChange: <K extends keyof WorkflowStage>(
    stageId: string,
    key: K,
    value: WorkflowStage[K],
  ) => void;
  onToggleStage: (stageId: string) => void;
  onRemoveApprover: (stageId: string, approverId: string) => void;
  onAddApprover: (stageId: string, approver: Approver) => void;
  onBack: () => void;
  onSubmit: () => void;
  onAddStage: () => void;
};

const WorkflowStagesForm = ({
  stages,
  onStageChange,
  onToggleStage,
  onRemoveApprover,
  onAddApprover,
  onBack,
  onAddStage,
  onSubmit,
}: Props) => {
  return (
    <div>
      <div className="workflow-stage-list">
        {stages.length === 0 ? (
          <div className="workflow-empty-state">
            No stages added yet. Click <strong>Add another stage</strong> to
            start configuring your workflow.
          </div>
        ) : (
          stages.map((stage) => {
            return (
              <React.Fragment key={stage.id}>
                <div
                  className={`workflow-stage-card ${
                    stage.isExpanded ? "workflow-stage-card-expanded" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="workflow-stage-header"
                    onClick={() => onToggleStage(stage.id)}
                  >
                    <div
                      className={`workflow-stage-number ${
                        stage.isExpanded ? "workflow-stage-number-active" : ""
                      }`}
                    >
                      {stage.stageOrder}
                    </div>

                    <div className="workflow-stage-header-content">
                      <div className="workflow-stage-title">{stage.name}</div>
                      <div className="workflow-stage-meta">
                        {stage.approvers.length} approver
                        {stage.approvers.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <span className="workflow-stage-step-pill">
                      Step {stage.stageOrder}
                    </span>

                    <span
                      className={`workflow-stage-chevron ${
                        stage.isExpanded ? "workflow-stage-chevron-open" : ""
                      }`}
                    >
                      ›
                    </span>
                  </button>

                  {stage.isExpanded && (
                    <div className="workflow-stage-body">
                      <div className="workflow-create-field-row workflow-create-field-row-3">
                        <div className="workflow-create-field-group">
                          <label className="workflow-create-label">
                            Stage name
                          </label>
                          <input
                            className="workflow-create-input workflow-create-input-sm"
                            value={stage.name}
                            onChange={(e) =>
                              onStageChange(stage.id, "name", e.target.value)
                            }
                          />
                        </div>

                        <div className="workflow-create-field-group">
                          <label className="workflow-create-label">
                            Minimum approvals
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="workflow-create-input workflow-create-input-sm"
                            value={stage.minApprovals ?? stage.approvers.length}
                            onChange={(e) =>
                              onStageChange(
                                stage.id,
                                "minApprovals",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className="workflow-create-field-group">
                          <p>/{stage.approvers.length}</p>
                        </div>
                      </div>
                      <div className="workflow-approver-list">
                        {stage.approvers.map((approver) => {
                          return (
                            <div
                              key={approver.id}
                              className="workflow-approver-row"
                            >
                              <div className="workflow-approver-avatar workflow-approver-avatar-orange">
                                <Avatar
                                  firstName={approver.firstName || ""}
                                  lastName={approver.lastName}
                                  imageUrl={""}
                                  size="md"
                                  isTooltip={false}
                                />
                              </div>

                              <div className="workflow-approver-content">
                                <div className="workflow-approver-name">
                                  {approver.name}
                                </div>
                                <div className="workflow-approver-role">
                                  {approver.email}
                                </div>
                              </div>

                              <button
                                type="button"
                                className="workflow-remove-btn"
                                onClick={() =>
                                  onRemoveApprover(stage.id, approver.id)
                                }
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <UserAsyncSelect
                  label="Approvers"
                  excludedUserIds={stage.approvers.map((a) => a.id)}
                  onChange={(selected) => {
                    if (!selected) return;

                    onAddApprover(stage.id, {
                      id: selected.value,
                      name: selected.label,
                      email: selected.email,
                      firstName: selected.firstName,
                      lastName: selected.lastName,
                    });
                  }}
                />
              </React.Fragment>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="workflow-add-stage-btn"
        onClick={onAddStage}
      >
        <Plus size={14} />
        Add another stage
      </button>

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          className="workflow-create-secondary-btn"
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="button"
          className="workflow-create-primary-btn"
          onClick={onSubmit}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WorkflowStagesForm;
