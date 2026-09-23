import WorkFlowGenForm from "./WorkFlowGenForm";
import WorkflowStagesForm from "./WorkflowStagesForm";
import WorkflowViewForm from "./WorkflowViewForm";

import type {
	WorkflowGenErrors,
	WorkFlowProps,
	WorkflowStageErrors,
} from "../types/types";

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
	onRemoveStage,
	onResetStages,
	currentUserId,
	onAddStage,
	basicErrors,
	stageErrors,
	stageFormError,
	onClearBasicError,
	appOptions,
	categoryOptions,
	showCategory,
	showStatus,
}: Props) => {
	return (
		<div className="w-full h-full">
			{currentStep === 1 && (
				<WorkFlowGenForm
					basics={basics}
					errors={basicErrors}
					onBasicChange={onBasicChange}
					onClearError={onClearBasicError}
					appOptions={appOptions}
					categoryOptions={categoryOptions}
					showCategory={showCategory}
					showStatus={showStatus}
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
					onRemoveStage={onRemoveStage}
					onResetStages={onResetStages}
					onBack={goBack}
					onSubmit={goNext}
					onAddStage={onAddStage}
					hideNavActions
					hideResetAction
				/>
			)}

			{currentStep === 3 && (
				<WorkflowViewForm basics={basics} stages={stages} />
			)}
		</div>
	);
};

export default WorkflowCreateMain;
