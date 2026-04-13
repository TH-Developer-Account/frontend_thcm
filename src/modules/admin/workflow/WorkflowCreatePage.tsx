import React, { useMemo, useState } from "react";
import PageSectionLayout, {
	PageSection,
} from "../../../layout/PageSectionLayout";
import WorkflowCreateHeader from "./components/WorkflowCreateHeader";
import WorkflowCreateMain from "./components/WorkflowCreateMain";
import WorkflowCreateSidebar from "./components/WorkflowCreateSidebar";
import {
	availableUsers,
	createInitialStages,
	getCurrentUserApprover,
	initialBasics,
	initialSettings,
	regionOptions,
} from "./constant/workflow.constant";
import { createWorkflowApi } from "./api/workflow.api";
import {
	addStageApprover,
	buildWorkflowPayload,
	removeStageApprover,
	toggleStageExpanded,
	updateStageField,
	validateWorkflow,
} from "./utils/workflow.helpers";
import type {
	FlowType,
	WorkflowBasics,
	WorkflowSettings,
	WorkflowStage,
} from "./types/workflow.types";

const WorkflowCreatePage = () => {
	const [currentStep, setCurrentStep] = useState(1);

	const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
	const goBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

	const auth = {
		user: {
			id: "e96499be-11e5-4a32-88c5-7dec0d336fd1",
			first_name: "Angel",
			last_name: "Toy",
			email: "billie.feil11@hotmail.com",
		},
		workspaceId: "8ede9c16-117a-46a1-8175-b2e3d16d2e6a",
	};

	const workspaceId = auth?.workspaceId ?? "";
	const currentUserApprover = getCurrentUserApprover(auth.user);

	const [basics, setBasics] = useState<WorkflowBasics>(initialBasics);
	const [stages, setStages] = useState<WorkflowStage[]>(
		createInitialStages(currentUserApprover),
	);
	const [settings, setSettings] = useState<WorkflowSettings>(initialSettings);
	const [flowType, setFlowType] = useState<FlowType>("SEQUENTIAL");

	const totalApprovers = useMemo(
		() => stages.reduce((sum, stage) => sum + stage.approvers.length, 0),
		[stages],
	);

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
		setStages((prev) => updateStageField(prev, stageId, key, value));
	};

	const toggleStage = (stageId: string) => {
		setStages((prev) => toggleStageExpanded(prev, stageId));
	};

	const removeApprover = (stageId: string, approverId: string) => {
		setStages((prev) => removeStageApprover(prev, stageId, approverId));
	};

	const addApprover = (stageId: string, approver: any) => {
		setStages((prev) => addStageApprover(prev, stageId, approver));
	};

	const handleSubmit = () => {
		const error = validateWorkflow(basics, stages, workspaceId);

		if (error) {
			console.error("Validation Error:", error);
			return;
		}

		const payload = buildWorkflowPayload(basics, stages, workspaceId);

		console.log("FINAL PAYLOAD:", payload);
		console.log("FINAL PAYLOAD JSON:", JSON.stringify(payload, null, 2));
	};

	const selectedRegionLabel =
		regionOptions.find((item) => item.value === basics.regionId)?.label ?? "--";

	return (
		<PageSectionLayout>
			<PageSection className="workflow-create-page-box">
				<div className="workflow-create-page">
					<WorkflowCreateHeader currentStep={currentStep} />

					<div className="workflow-create-page-header">
						<h2 className="workflow-create-page-title">
							Create approval workflow
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
							currentUserId={auth.user.id}
							onBasicChange={handleBasicChange}
							onStageChange={handleStageChange}
							onToggleStage={toggleStage}
							onRemoveApprover={removeApprover}
							onAddApprover={addApprover}
							onSubmit={handleSubmit}
						/>

						<WorkflowCreateSidebar
							module={basics.name || "--"}
							budgetCode={`${basics.minBudget || 0} - ${basics.maxBudget || 0}`}
							zone={selectedRegionLabel}
							stageCount={stages.length}
							approverCount={totalApprovers}
							flowType={flowType}
							onFlowTypeChange={setFlowType}
							settings={settings}
							onSettingsChange={setSettings}
						/>
					</div>
				</div>
			</PageSection>
		</PageSectionLayout>
	);
};

export default WorkflowCreatePage;
