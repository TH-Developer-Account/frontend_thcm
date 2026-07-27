import { ArrowLeft, FileText, Plus } from "lucide-react";
import WorkFlowGenForm from "./WorkFlowGenForm";
import WorkflowStagesForm from "./WorkflowStagesForm";
import WorkflowViewForm from "./WorkflowViewForm";
import type {
	WorkFlowProps,
	WorkflowGenErrors,
	WorkflowStageErrors,
} from "../../workflows/types/workflow.types";
import Button from "../../../components/common/Button";

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
		<div className="">
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
						<Button
							onClick={goBack}
							type="button"
							text="Back"
							Icon={ArrowLeft}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							size="sm"
						/>
						<Button
							onClick={onSubmit}
							disabled={loading}
							type="button"
							text={loading ? "Saving..." : "Save workflow"}
							appearance="standard"
							variant="brand"
							size="sm"
						/>
					</div>
				</>
			)}
		</div>
	);
};

export default WorkflowCreateMain;
