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
	regionOptions,
} from "./constant/workflow.constant";
import { submitWorkflow } from "./api/workflow.api";
import {
	addStageApprover,
	removeStageApprover,
	toggleStageExpanded,
	updateStageField,
} from "./utils/workflow.helpers";
import type { WorkflowBasics, WorkflowStage } from "./types/workflow.types";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";

const WorkflowCreatePage = () => {
	// 🔥 AUTH FIRST
	const { user, workspaceId, isLoading } = useAuth();
	const { showToast } = useToast();

	if (isLoading || !user || !workspaceId) return null;

	// 🔥 derive user
	const currentUserApprover = getCurrentUserApprover(user);

	// 🔥 STATE
	const [currentStep, setCurrentStep] = useState(1);
	const [basics, setBasics] = useState<WorkflowBasics>(initialBasics);
	const [stages, setStages] = useState<WorkflowStage[]>(
		createInitialStages(currentUserApprover),
	);
	const [loading, setLoading] = useState(false);

	// 🔥 DERIVED
	const totalApprovers = useMemo(
		() => stages.reduce((sum, stage) => sum + stage.approvers.length, 0),
		[stages],
	);

	// 🔥 NAV
	const goNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
	const goBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

	// 🔥 HANDLERS
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

	// 🔥 SUBMIT
	const handleSubmit = async () => {
		setLoading(true);

		try {
			const response = await submitWorkflow({
				basics,
				stages,
				workspaceId,
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

	// 🔥 UI HELPERS
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
							currentUserId={user.id}
							onBasicChange={handleBasicChange}
							onStageChange={handleStageChange}
							onToggleStage={toggleStage}
							onRemoveApprover={removeApprover}
							onAddApprover={addApprover}
							onSubmit={handleSubmit}
							loading={loading}
						/>

						<WorkflowCreateSidebar
							module={basics.name || "--"}
							budgetCode={`${basics.minBudget || 0} - ${basics.maxBudget || 0}`}
							zone={selectedRegionLabel}
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
