import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import WorkflowCreateMain from "../components/WorkflowCreateMain";
import WorkflowCreateSidebar from "../components/WorkflowCreateSidebar";
import { mapBasics, mapStages } from "../utils/workflow.helpers";
import {
	buildWorkflowPayload,
	toggleStageExpanded,
	updateStageField,
	validateWorkflow,
	validateWorkflowBasics,
	getDefaultMapStages,
} from "../utils/workflow.helpers";
import { budgetCategories, formatApps } from "../constant/workflow.constant";

import type {
	WorkflowBasics,
	WorkflowApprover,
	WorkflowGenErrors,
	WorkflowStage,
	WorkflowStageErrors,
} from "../types/types";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import { getWorkflowErrorMessage, workflowApi } from "../api/workflow.api";
import { useSaveWorkflowMutation } from "../context/useWorkflowMutations";

const WorkflowCreatePage = () => {
	const { user, workspaceId, isLoading, permissions } = useAuth();
	const { showToast } = useToast();
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const isUserCreatedWorkflow =
		!id &&
		(location.state as { workflowType?: string } | null)?.workflowType ===
			"USERCREATED";

	const [currentStep, setCurrentStep] = useState(1);
	const [loadingWorkflow, setLoadingWorkflow] = useState(false);
	const [savingUserWorkflow, setSavingUserWorkflow] = useState(false);
	const saveMutation = useSaveWorkflowMutation();
	const loading = loadingWorkflow || savingUserWorkflow || saveMutation.loading;

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
	const workflowCreateSteps = [
		{ id: 1, label: "Workflow basics" },
		{ id: 2, label: "Approval stages" },
		{ id: 3, label: "Review & Submit" },
	];
	useEffect(() => {
		if (!id) return;

		const fetchWorkflow = async () => {
			try {
				setLoadingWorkflow(true);
				const workflow = await workflowApi.getById(id);

				if (!workflow?.id) {
					console.error("Workflow data not found for id:", id);
					return;
				}

				setBasics(mapBasics(workflow));
				setStages(mapStages(workflow.stages ?? []));
			} catch (error) {
				console.error("Failed to fetch workflow", error);
			} finally {
				setLoadingWorkflow(false);
			}
		};

		fetchWorkflow();
	}, [id]);

	const totalApprovers = useMemo(
		() => stages.reduce((sum, stage) => sum + stage.approvers.length, 0),
		[stages],
	);

	const appOptions = useMemo(
		() => formatApps(permissions ?? []),
		[permissions],
	);

	const showCategory = basics.appDesc === "Marketing Activity Planner";

	const showStatus = Boolean(id);

	const handleBasicChange = <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => {
		setBasics((prev) => {
			const updatedBasics = { ...prev, [key]: value };

			if ((key === "app" || key === "appDesc") && !id) {
				const isMarketingActivityPlanner =
					updatedBasics.appDesc === "Marketing Activity Planner";

				if (isMarketingActivityPlanner) {
					setStages((prevStages) => {
						if (prevStages.length > 0) return prevStages;

						const defaultStages = getDefaultMapStages();
						setStageErrors(defaultStages.map(() => ({})));
						return defaultStages;
					});
				} else {
					setStages([]);
					setStageErrors([]);
					setStageFormError(null);
				}
			}

			return updatedBasics;
		});
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
		setStages((prev) =>
			prev.map((stage) => {
				if (stage.id !== stageId) return stage;

				const updatedApprovers = stage.approvers.filter(
					(a) => a.id !== approverId,
				);

				return {
					...stage,
					approvers: updatedApprovers,
					minApprovals: updatedApprovers.length, // ✅ always reset to total
				};
			}),
		);

		setStageErrors((prev) =>
			prev.map((stageError, index) =>
				stages[index]?.id === stageId
					? { ...stageError, approvers: "", minApprovals: "" }
					: stageError,
			),
		);
	};

	const addApprover = (stageId: string, approver: WorkflowApprover) => {
		setStages((prev) =>
			prev.map((stage) => {
				if (stage.id !== stageId) return stage;

				const updatedApprovers = [...stage.approvers, approver];

				return {
					...stage,
					approvers: updatedApprovers,
					minApprovals: updatedApprovers.length, // ✅ default = total
				};
			}),
		);

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
			const payload = buildWorkflowPayload(basics, stages, workspaceId);
			setSavingUserWorkflow(isUserCreatedWorkflow);

			const data = (
				isUserCreatedWorkflow
					? await workflowApi.createUser(payload)
					: await saveMutation.mutateAsync(id, payload)
			) as {
				message?: string;
			};

			showToast({
				type: "success",
				title: "Success",
				description: data?.message || "Workflow saved successfully",
			});
			navigate(`/workflow/listing`);
		} catch (error: unknown) {
			showToast({
				type: "error",
				title: "Error",
				description: getWorkflowErrorMessage(error, "Failed to save workflow"),
			});
		} finally {
			setSavingUserWorkflow(false);
		}
	};

	if (isLoading) return null;
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Workflow Creation"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendors listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Workflows Listing",
							href: "/workflow/listing",
						},
						{
							label: id ? "Update Workflow" : "Create Workflow",
						},
					],
					separator: "›",
				}}
			/>
			<Card>
				<StepProgress
					steps={workflowCreateSteps}
					currentStep={currentStep}
					className="workflow-create-step-progress"
					ariaLabel="Workflow creation progress"
				/>

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
						appOptions={appOptions}
						categoryOptions={budgetCategories}
						showCategory={showCategory}
						showStatus={showStatus}
					/>

					<WorkflowCreateSidebar
						basics={basics}
						stageCount={stages.length}
						approverCount={totalApprovers}
						minApprovers={totalApprovers}
					/>
				</div>
			</Card>
		</PageSectionLayout>
	);
};

export default WorkflowCreatePage;
