import React, { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useMasterData } from "../../../../hooks/useMasterData";
import WorkFlowGenForm from "./WorkFlowGenForm";
import WorkflowStagesForm from "./WorkflowStagesForm";
import type { FormValues, WorkFlowProps } from "../types/workflow.types";
import WorkflowViewForm from "./WorkflowViewForm";

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
}: WorkFlowProps) => {
	const [values, setValues] = useState<FormValues>({
		isActive: true,
		status: "active",
		zone: "",
		app: "",
	});

	const { data } = useMasterData();

	const handleChange = (name: keyof FormValues, value: string | boolean) => {
		setValues((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const stepConfig: Record<
		number,
		{
			title: string;
			icon: React.ReactNode;
			iconClass: string;
			meta?: (items: typeof stages) => string;
		}
	> = {
		1: {
			title: "Workflow basics",
			icon: <FileText size={14} />,
			iconClass: "workflow-create-card-icon-orange",
		},
		2: {
			title: "Approval stages",
			icon: <Plus size={14} />,
			iconClass: "workflow-create-card-icon-violet",
			meta: (items) => `${items.length} stages configured`,
		},
		3: {
			title: "Review & Submit",
			icon: <FileText size={14} />,
			iconClass: "workflow-create-card-icon-orange",
		},
	};

	const config = stepConfig[currentStep];

	return (
		<div className="workflow-create-main">
			<div className="workflow-create-card">
				<div className="workflow-create-card-title">
					<div className={`workflow-create-card-icon ${config.iconClass}`}>
						{config.icon}
					</div>

					{config.title}

					{config.meta && (
						<span className="workflow-create-card-title-meta">
							{config.meta(stages)}
						</span>
					)}
				</div>

				{currentStep === 1 && (
					<WorkFlowGenForm
						basics={basics}
						values={values}
						regionOptions={data?.regions || []}
						appOptions={data?.apps || []}
						onBasicChange={onBasicChange}
						onFieldChange={handleChange}
						onNext={goNext}
					/>
				)}

				{currentStep === 2 && (
					<WorkflowStagesForm
						stages={stages}
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
						<WorkflowViewForm basics={basics} values={values} stages={stages} />

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
