import React from "react";
import { GitBranch, Check } from "lucide-react";

type Props = {
  currentStep: number;
};

const steps = [
  { id: 1, label: "Workflow basics" },
  { id: 2, label: "Approval stages" },
  { id: 3, label: "Review & Submit" },
];

const WorkflowCreateHeader = ({ currentStep }: Props) => {
  return (
    <>
      <div className="workflow-create-topbar">
        <div className="workflow-create-badge">
          <GitBranch size={14} />
          Approval Workflow
        </div>
      </div>

      <div className="workflow-progress">
        {steps.map((step, index) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="workflow-progress-step">
                <div
                  className={`workflow-progress-dot ${
                    isDone
                      ? "workflow-progress-dot-done"
                      : isActive
                        ? "workflow-progress-dot-active"
                        : "workflow-progress-dot-wait"
                  }`}
                >
                  {isDone ? <Check size={12} /> : step.id}
                </div>

                <span
                  className={`workflow-progress-label ${
                    isDone
                      ? "workflow-progress-label-done"
                      : isActive
                        ? "workflow-progress-label-active"
                        : "workflow-progress-label-wait"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="workflow-progress-line" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
};

export default WorkflowCreateHeader;
