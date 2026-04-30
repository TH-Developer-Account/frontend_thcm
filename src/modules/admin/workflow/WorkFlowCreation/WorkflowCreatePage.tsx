import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ServerAxios } from "../../../../services/ServerAxios";

import WorkflowCreateHeader from "./components/WorkflowCreateHeader";
import WorkflowCreateMain from "./WorkflowCreateMain";
import WorkflowCreateSidebar from "./components/WorkflowCreateSidebar";
import { mapBasics, mapStages } from "../utils/workflow.helpers";
import { api_routes } from "../constant/workflow.constant";
import {
	addStageApprover,
	buildWorkflowPayload,
	removeStageApprover,
	toggleStageExpanded,
	updateStageField,
	validateWorkflow,
	validateWorkflowBasics,
} from "../utils/workflow.helpers";
import type {
	Approver,
	WorkflowBasics,
	WorkflowGenErrors,
	WorkflowStage,
	WorkflowStageErrors,
} from "../types/workflow.types";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";

const WorkflowCreatePage = () => {
	const { user, workspaceId, isLoading } = useAuth();
	const { showToast } = useToast();
	const { id } = useParams();
	const navigate = useNavigate();

	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);

	const [basics, setBasics] = useState<WorkflowBasics>({
		name: "",
		app: "",
		appDesc: "",
		isActive: true,
		description: "",
		category: "",
	});

	const [stages, setStages] = useState<WorkflowStage[]>([]);
	const [basicErrors, setBasicErrors] = useState<WorkflowGenErrors>({});
	const [stageErrors, setStageErrors] = useState<WorkflowStageErrors[]>([]);
	const [stageFormError, setStageFormError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;

		const fetchWorkflow = async () => {
			try {
				setLoading(true);

				const response = await ServerAxios.get(`/work-flow/${id}`);

				const workflow =
					response.data?.data?.data ?? response.data?.data ?? response.data;

				if (!workflow?.id) {
					console.error("Workflow data not found:", response.data);
					return;
				}

				setBasics(mapBasics(workflow));
				setStages(mapStages(workflow.stages ?? []));
			} catch (error) {
				console.error("Failed to fetch workflow", error);
			} finally {
				setLoading(false);
			}
		};

		fetchWorkflow();
	}, [id]);

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

	const clearBasicError = (key: keyof WorkflowGenErrors) => {
		setBasicErrors((prev) => ({ ...prev, [key]: "" }));
	};

	const handleStageChange = <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => {
		setStages((prev) => updateStageField(prev, stageId, key, value));

		setStageErrors((prev) =>
			prev.map((stageError, index) =>
				stages[index]?.id === stageId
					? { ...stageError, [key]: "" }
					: stageError,
			),
		);
	};

	const toggleStage = (stageId: string) => {
		setStages((prev) => toggleStageExpanded(prev, stageId));
	};

	const removeApprover = (stageId: string, approverId: string) => {
		setStages((prev) => removeStageApprover(prev, stageId, approverId));

		setStageErrors((prev) =>
			prev.map((stageError, index) =>
				stages[index]?.id === stageId
					? { ...stageError, approvers: "", minApprovals: "" }
					: stageError,
			),
		);
	};

	const addApprover = (stageId: string, approver: Approver) => {
		setStages((prev) => addStageApprover(prev, stageId, approver));

		setStageErrors((prev) =>
			prev.map((stageError, index) =>
				stages[index]?.id === stageId
					? { ...stageError, approvers: "", minApprovals: "" }
					: stageError,
			),
		);
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
				minApprovals: 1,
				isExpanded: true,
			},
		]);

		setStageErrors((prev) => [...prev, {}]);
	};

	const handleNext = () => {
		if (currentStep === 1) {
			const errors = validateWorkflowBasics(basics);

			if (Object.keys(errors).length > 0) {
				setBasicErrors(errors);
				return;
			}

			setBasicErrors({});
			setCurrentStep(2);
			return;
		}

		if (currentStep === 2) {
			const { formError, stageErrors } = validateWorkflow(stages);

			const hasErrors = stageErrors.some(
				(stageError) => Object.keys(stageError).length > 0,
			);

			if (formError || hasErrors) {
				setStageFormError(formError || null);
				setStageErrors(stageErrors);
				return;
			}

			setStageFormError(null);
			setStageErrors([]);
			setCurrentStep(3);
		}
	};

	const handleBack = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
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

		try {
			setLoading(true);

			const payload = buildWorkflowPayload(basics, stages, workspaceId);

			const { data } = await ServerAxios.post(
				id ? `/work-flow/update/${id}` : api_routes.create_workflow_api_route,
				payload,
			);

			showToast({
				type: "success",
				title: "Success",
				description: data?.message || "Workflow saved successfully",
			});
			navigate(`/admin/workflows`);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save workflow";

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
		<div className="workflow-create-page-box content-box">
			<div className="workflow-create-page">
				<WorkflowCreateHeader currentStep={currentStep} />

				<div className="workflow-create-page-header">
					<h2 className="workflow-create-page-title">
						{id ? "Update Workflow" : "Create Workflow"}
					</h2>
					<p className="workflow-create-page-subtitle">
						Define who approves what, in which order, and under what conditions.
					</p>
				</div>

				<div className="workflow-create-grid">
					<WorkflowCreateMain
						currentStep={currentStep}
						goNext={handleNext}
						goBack={handleBack}
						basics={basics}
						stages={stages}
						currentUserId={user?.id || ""}
						onBasicChange={handleBasicChange}
						onStageChange={handleStageChange}
						onToggleStage={toggleStage}
						onRemoveApprover={removeApprover}
						onAddApprover={addApprover}
						onAddStage={addStage}
						onSubmit={handleSubmit}
						loading={loading}
						basicErrors={basicErrors}
						stageErrors={stageErrors}
						stageFormError={stageFormError}
						onClearBasicError={clearBasicError}
					/>

					<WorkflowCreateSidebar
						basics={basics}
						stageCount={stages.length}
						approverCount={totalApprovers}
						minApprovers={2}
					/>
				</div>
			</div>
		</div>
	);
};

export default WorkflowCreatePage;
