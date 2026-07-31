import { ArrowLeft } from "lucide-react";
import WorkFlowGenForm from "./WorkFlowGenForm";
import WorkflowStagesForm from "./WorkflowStagesForm";
import WorkflowViewForm from "./WorkflowViewForm";

import Button from "../../../components/common/Button";
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
	onSubmit,
	currentUserId,
	onAddStage,
	loading,
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
		<div className="w-full">
			{currentStep === 1 && (
				<WorkFlowGenForm
					basics={basics}
					errors={basicErrors}
					onBasicChange={onBasicChange}
					onClearError={onClearBasicError}
					onNext={goNext}
					onBack={goBack}
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
					onBack={goBack}
					onSubmit={goNext}
					onAddStage={onAddStage}
				/>
			)}

			{currentStep === 3 && (
				<>
					<WorkflowViewForm basics={basics} stages={stages} />

					<div className="workflow-form-actions">
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
