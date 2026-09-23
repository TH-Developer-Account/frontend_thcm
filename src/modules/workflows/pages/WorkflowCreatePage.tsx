import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import WorkflowCreateMain from "../components/WorkflowCreateMain";
import WorkflowCreateSidebar from "../components/WorkflowCreateSidebar";
import { mapBasics, mapStages } from "../utils/workflow.helpers";
import {
	buildWorkflowPayload,
	toggleStageExpanded,
	updateStageField,
	removeStage,
	getResetStages,
	validateWorkflow,
	validateWorkflowBasics,
	getDefaultMapStages,
	createStageId,
} from "../utils/workflow.helpers";
import {
	budgetCategories,
	formatApps,
	MARKETING_ACTIVITY_PLANNER_APP_NAME,
} from "../utils/workflow.constants";

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
import Button from "../../../components/common/Button";
import { Alert } from "../../../components/common/Alert";
import { Modal } from "../../../components/common/Modal";
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
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
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

	const showCategory = basics.appDesc === MARKETING_ACTIVITY_PLANNER_APP_NAME;

	const showStatus = Boolean(id);

	const handleBasicChange = <K extends keyof WorkflowBasics>(
		key: K,
		value: WorkflowBasics[K],
	) => {
		setBasics((prev) => {
			const updatedBasics = { ...prev, [key]: value };

			if ((key === "app" || key === "appDesc") && !id) {
				const isMarketingActivityPlanner =
					updatedBasics.appDesc === MARKETING_ACTIVITY_PLANNER_APP_NAME;

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
				// A length-derived id (the previous `stage-${prev.length + 1}`)
				// can collide with an existing stage's id after an add/remove
				// cycle brings the count back down — createStageId() avoids that.
				id: createStageId(),
				stageOrder: prev.length + 1,
				// Left blank rather than a "Stage N" placeholder: the stage-name
				// field is a required dropdown (Recommender/Checker/Approver),
				// and a non-empty placeholder here both hid the "Select stage
				// name" prompt behind a value that matched no option and let
				// validateWorkflow's required-name check silently pass without
				// the user ever picking one.
				name: "",
				strategy: "ANY",
				approvers: [],
				minApprovals: 1,
				isExpanded: true,
			},
		]);

		setStageErrors((prev) => [...prev, {}]);
	};

	// Removes a whole stage (as opposed to removeApprover, which only removes
	// one approver from a stage). Keeps stageErrors aligned to the stages
	// array by dropping the same index, and renumbers the remaining stages'
	// stageOrder via the removeStage helper so "Stage 3" doesn't survive as
	// the only stage after "Stage 1" and "Stage 2" are removed.
	const removeStageById = (stageId: string) => {
		const indexToRemove = stages.findIndex((stage) => stage.id === stageId);

		setStages((prev) => removeStage(prev, stageId));

		setStageErrors((prev) =>
			indexToRemove === -1
				? prev
				: prev.filter((_, index) => index !== indexToRemove),
		);

		setStageFormError(null);
	};

	// "Reset stages" — clears every stage and approver configured so far and
	// leaves a single blank stage to start over from. Distinct from
	// removeStageById, which only removes one stage at a time.
	const resetStages = () => {
		setStages(getResetStages());
		setStageErrors([{}]);
		setStageFormError(null);
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
		if (currentStep === 1) {
			navigate("/workflow/listing");
			return;
		}

		setCurrentStep((prev) => prev - 1);
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
			<Card
				title={
					<StepProgress
						steps={workflowCreateSteps}
						currentStep={currentStep}
						className="workflow-create-step-progress"
						ariaLabel="Workflow creation progress"
					/>
				}
				headerClassName="border-none"
				footer={
					<div className="bottom-buttons-bar-between">
						<Button
							onClick={handleBack}
							type="button"
							text="Back"
							Icon={ArrowLeft}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							size="sm"
						/>

						<div className="bottom-buttons-bar-end">
							{currentStep === 2 && stages.length > 0 && (
								<Button
									type="button"
									text="Reset stages"
									Icon={RotateCcw}
									iconPosition="left"
									appearance="standard"
									variant="outline"
									size="sm"
									onClick={() => setIsResetConfirmOpen(true)}
								/>
							)}

							{currentStep === 3 ? (
								<Button
									onClick={handleSubmit}
									disabled={loading}
									type="button"
									text={loading ? "Saving..." : "Save workflow"}
									appearance="standard"
									variant="brand"
									size="sm"
								/>
							) : (
								<Button
									onClick={handleNext}
									type="button"
									text="Next"
									Icon={ArrowRight}
									iconPosition="right"
									appearance="standard"
									size="sm"
									variant="brand"
								/>
							)}
						</div>
					</div>
				}
			>
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
						onRemoveStage={removeStageById}
						onResetStages={resetStages}
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

			<Modal
				open={isResetConfirmOpen}
				onClose={() => setIsResetConfirmOpen(false)}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Reset approval stages confirmation"
			>
				<Alert
					variant="warning"
					title="Reset approval stages"
					description="This removes every stage and approver you've configured here and starts over with a single blank stage. This can't be undone."
					primaryAction={{
						label: "Reset",
						onClick: () => {
							resetStages();
							setIsResetConfirmOpen(false);
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setIsResetConfirmOpen(false),
					}}
				/>
			</Modal>
		</PageSectionLayout>
	);
};

export default WorkflowCreatePage;
