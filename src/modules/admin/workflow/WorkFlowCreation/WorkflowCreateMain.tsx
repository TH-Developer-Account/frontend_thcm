import { FileText, Plus } from "lucide-react";
import WorkFlowGenForm from "./WorkFlowGenForm";
import WorkflowStagesForm from "./WorkflowStagesForm";
import WorkflowViewForm from "./WorkflowViewForm";
import type {
	WorkFlowProps,
	WorkflowGenErrors,
	WorkflowStageErrors,
} from "../types/workflow.types";

type Props = WorkFlowProps & {
	basicErrors: WorkflowGenErrors;
	stageErrors: WorkflowStageErrors[];
	stageFormError: string | null;
	onClearBasicError: (key: keyof WorkflowGenErrors) => void;
};

const WorkflowCreateMain = ({
	currentStep,
	goNext,
	goBack,
	basics,
	stages,
	onBasicChange,
	onStageChange,
	onToggleStage,
	onRemoveApprover,
	onAddApprover,
	onSubmit,
	availableUsers,
	currentUserId,
	onAddStage,
	loading,
	basicErrors,
	stageErrors,
	stageFormError,
	onClearBasicError,
}: Props) => {
	const title =
		currentStep === 1
			? "Workflow basics"
			: currentStep === 2
				? "Approval stages"
				: "Review & Submit";

	const icon = currentStep === 2 ? <Plus size={14} /> : <FileText size={14} />;

	const iconClass =
		currentStep === 2
			? "workflow-create-card-icon-violet"
			: "workflow-create-card-icon-orange";

	return (
		<div className="workflow-create-main">
			<div className="workflow-create-card">
				<div className="workflow-create-card-title">
					<div className={`workflow-create-card-icon ${iconClass}`}>{icon}</div>

					{title}

					{currentStep === 2 && (
						<span className="workflow-create-card-title-meta">
							{stages.length} stages configured
						</span>
					)}
				</div>

				{currentStep === 1 && (
					<WorkFlowGenForm
						basics={basics}
						errors={basicErrors}
						onBasicChange={onBasicChange}
						onClearError={onClearBasicError}
						onNext={goNext}
					/>
				)}

				{currentStep === 2 && (
					<WorkflowStagesForm
						stages={stages}
						errors={stageErrors}
						formError={stageFormError}
						currentUserId={currentUserId}
						availableUsers={availableUsers}
						onStageChange={onStageChange}
						onToggleStage={onToggleStage}
						onRemoveApprover={onRemoveApprover}
						onAddApprover={onAddApprover}
						onBack={goBack}
						onSubmit={goNext}
						onAddStage={onAddStage}
					/>
				)}

				{currentStep === 3 && (
					<>
						<WorkflowViewForm basics={basics} stages={stages} />

						<div className="mt-4 flex justify-between">
							<button
								type="button"
								className="workflow-create-secondary-btn"
								onClick={goBack}
							>
								Back
							</button>

							<button
								type="button"
								className="workflow-create-primary-btn"
								onClick={onSubmit}
								disabled={loading}
							>
								{loading ? "Saving..." : "Save workflow"}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default WorkflowCreateMain;
