import { useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Pencil,
	RefreshCcw,
	Undo2,
} from "lucide-react";

import Button from "../../../components/common/Button";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import { ApprovalWorkflowTableContent } from "../index"; // adjust to this module's own barrel
import { WorkflowFetchPage } from "../pages/WorkflowFetchPage";
import WorkflowStagesForm from "./WorkflowStagesForm";

import type {
	ApprovalStageLike,
	PendingWorkflowSelection,
	WorkflowStage,
	WorkflowApprover,
	WorkflowStageErrors,
} from "../types/types";

import { validateWorkflow } from "../utils/workflow.helpers";

type WorkflowSource = "active" | "selection";

type ActiveWorkflowLike = {
	id: string;
	template?: { name?: string } | null;
	stages: ApprovalStageLike[];
};

type WorkflowCustomizationSectionProps = {
	sourceRecordRef?: string;
	recordType: string;

	selectedWorkflow: PendingWorkflowSelection | null;

	activeWorkflow?: ActiveWorkflowLike | null;

	isClarificationResubmission?: boolean;

	onWorkflowSelected: (
		selection: PendingWorkflowSelection,
	) => void | Promise<void>;

	onClearWorkflow: () => void;
	onBack: () => void;
	onNext: () => void;

	canEditActiveWorkflow?: boolean;
	stageEdits: WorkflowStage[] | null;
	onStageEditsChange: (stages: WorkflowStage[] | null) => void;

	// WorkflowStagesForm requires this for approver-select exclusion/permissions.
	currentUserId: string;
};

type SelectionWithPreview = PendingWorkflowSelection & {
	stages?: ApprovalStageLike[];
	previewStages?: ApprovalStageLike[];
	workflow?: {
		stages?: ApprovalStageLike[];
	};
};

const getSelectedWorkflowStages = (
	selection: PendingWorkflowSelection | null,
): ApprovalStageLike[] => {
	if (!selection) return [];

	const preview = selection as SelectionWithPreview;

	if (Array.isArray(preview.previewStages)) {
		return preview.previewStages;
	}

	if (Array.isArray(preview.stages)) {
		return preview.stages;
	}

	if (Array.isArray(preview.workflow?.stages)) {
		return preview.workflow.stages;
	}

	return [];
};

const createBlankStage = (): WorkflowStage => ({
	id: `new-stage-${Date.now()}`,
	name: "",
	stageOrder: 1,
	strategy: "ANY",
	minApprovals: 1,
	isExpanded: true,
	approvers: [],
});

// Keeps stageOrder contiguous (1..n) after a stage is removed, so numbering
// in the UI and any downstream payload stay in sync.
const reindexStages = (stages: WorkflowStage[]): WorkflowStage[] =>
	stages.map((stage, index) => ({ ...stage, stageOrder: index + 1 }));

const mapActiveStagesToEditable = (
	stages: ApprovalStageLike[],
): WorkflowStage[] =>
	stages.map((stage, index) => {
		const s = stage as ApprovalStageLike & {
			id: string;
			stageName?: string;
			stageOrder?: number;
			strategy?: WorkflowStage["strategy"];
			minApprovals?: number;
			approvals?: Array<{
				id: string;
				isExternalApprover?: boolean;
				approver?: {
					id: string;
					firstName?: string;
					lastName?: string;
					email?: string;
				};
			}>;
		};

		return {
			id: s.id,
			name: s.stageName ?? `Stage ${index + 1}`,
			stageOrder: s.stageOrder ?? index + 1,
			strategy: s.strategy ?? "ANY",
			minApprovals: s.minApprovals ?? 1,
			isExpanded: index === 0,
			approvers: (s.approvals ?? []).map(
				(approval): WorkflowApprover => ({
					id: approval.approver?.id ?? "",
					stageId: s.id,
					user: {
						id: approval.approver?.id ?? "",
						firstName: approval.approver?.firstName ?? "",
						lastName: approval.approver?.lastName ?? "",
						email: approval.approver?.email ?? "",
					},
					isExternalApprover: approval.isExternalApprover ?? false,
				}),
			),
		};
	});

const mapEditableStagesToPreview = (
	stages: WorkflowStage[],
): ApprovalStageLike[] =>
	stages.map((stage) => ({
		id: stage.id,
		stageOrder: stage.stageOrder,
		stageName: stage.name,
		name: stage.name,
		strategy: stage.strategy,
		minApprovals: stage.minApprovals,
		approvers: stage.approvers.map((approver) => ({
			id: approver.id,
			approverId: approver.user.id,
			userId: approver.user.id,
			user: approver.user,
			isExternalApprover: approver.isExternalApprover,
		})),
	}));

const CustomizedWorkflowSection = ({
	sourceRecordRef,
	recordType,
	selectedWorkflow,
	activeWorkflow,
	isClarificationResubmission = false,
	onWorkflowSelected,
	onClearWorkflow,
	onBack,
	onNext,
	canEditActiveWorkflow = true,
	stageEdits,
	onStageEditsChange,
	currentUserId,
}: WorkflowCustomizationSectionProps) => {
	/*
	 * Clarification starts by previewing the existing active workflow.
	 * The user can explicitly switch to workflow selection.
	 */
	const [workflowSource, setWorkflowSource] =
		useState<WorkflowSource>("active");

	const [isEditingCurrentWorkflow, setIsEditingCurrentWorkflow] =
		useState(false);
	const [selectedEditStages, setSelectedEditStages] = useState<
		WorkflowStage[] | null
	>(null);

	const [isCustomisingExistingWorkflow, setIsCustomisingExistingWorkflow] =
		useState(false);

	const [stageErrors, setStageErrors] = useState<WorkflowStageErrors[]>([]);
	const [stageFormError, setStageFormError] = useState<string | null>(null);

	const canUseActiveWorkflow = Boolean(
		isClarificationResubmission &&
		activeWorkflow?.id &&
		Array.isArray(activeWorkflow.stages) &&
		activeWorkflow.stages.length > 0,
	);

	const shouldUseActiveWorkflow =
		canUseActiveWorkflow && workflowSource === "active";

	const activeWorkflowStages: ApprovalStageLike[] = shouldUseActiveWorkflow
		? (activeWorkflow?.stages ?? [])
		: [];

	const selectedWorkflowStages = getSelectedWorkflowStages(selectedWorkflow);

	const previewStages: ApprovalStageLike[] = shouldUseActiveWorkflow
		? stageEdits && stageEdits.length > 0
			? mapEditableStagesToPreview(stageEdits)
			: activeWorkflowStages
		: selectedWorkflowStages;

	const workflowName = shouldUseActiveWorkflow
		? activeWorkflow?.template?.name || "Active approval workflow"
		: selectedWorkflow?.name || "Selected workflow";

	const hasWorkflow = isEditingCurrentWorkflow
		? Boolean(stageEdits && stageEdits.length > 0)
		: shouldUseActiveWorkflow
			? stageEdits && stageEdits.length > 0
				? true
				: activeWorkflowStages.length > 0
			: Boolean(selectedWorkflow && selectedWorkflowStages.length > 0);

	const showWorkflowPreview =
		shouldUseActiveWorkflow || Boolean(selectedWorkflow);
	const isEditingSelectedWorkflow = selectedEditStages !== null;
	const isEditingWorkflow =
		isEditingCurrentWorkflow || isEditingSelectedWorkflow;

	// Every mutation goes through this so parent's stageEdits (the payload
	// source of truth) and local render state never drift apart.
	const updateStages = (
		updater: (prev: WorkflowStage[]) => WorkflowStage[],
	) => {
		const next = updater(stageEdits ?? []);
		onStageEditsChange(next);
	};

	const updateSelectedStages = (
		updater: (prev: WorkflowStage[]) => WorkflowStage[],
	) => {
		setSelectedEditStages((current) => updater(current ?? []));
	};

	// ── "Change current workflow" → go pick/build a different one ──────────
	const handleChangeWorkflow = () => {
		/*
		 * This clears only the pending selection. It does not delete or
		 * modify the active workflow.
		 */
		setIsEditingCurrentWorkflow(false);
		setSelectedEditStages(null);
		onStageEditsChange(null);
		onClearWorkflow();
		setWorkflowSource("selection");
	};

	// ── "Edit current workflow" → edit the ACTIVE workflow's stages in place ──
	const handleEditCurrentWorkflow = () => {
		// Do NOT touch pendingWorkflowSelection — this is the stageEdits
		// path, kept entirely separate from the attach/selection flow.
		onClearWorkflow();
		setWorkflowSource("active");
		setStageErrors([]);
		setStageFormError(null);
		onStageEditsChange(mapActiveStagesToEditable(activeWorkflowStages));
		setIsEditingCurrentWorkflow(true);
	};

	const handleEditSelectedWorkflow = () => {
		if (!selectedWorkflow) return;

		setStageErrors([]);
		setStageFormError(null);
		setSelectedEditStages(
			selectedWorkflow.previewStages.map((stage, index) => ({
				...stage,
				stageOrder: index + 1,
				isExpanded: index === 0,
				approvers: stage.approvers.map((approver) => ({
					...approver,
					user: { ...approver.user },
				})),
			})),
		);
	};

	const handleCancelEditSelectedWorkflow = () => {
		setSelectedEditStages(null);
		setStageErrors([]);
		setStageFormError(null);
	};

	const handleConfirmEditSelectedWorkflow = async () => {
		if (!selectedWorkflow || !selectedEditStages) return;

		const validation = validateWorkflow(selectedEditStages);
		setStageErrors(validation.stageErrors);
		setStageFormError(validation.formError ?? null);

		const hasStageErrors = validation.stageErrors.some(
			(stageError) => Object.keys(stageError).length > 0,
		);

		if (validation.formError || hasStageErrors) {
			if (hasStageErrors) {
				setSelectedEditStages((current) =>
					(current ?? []).map((stage, index) =>
						Object.keys(validation.stageErrors[index] || {}).length > 0
							? { ...stage, isExpanded: true }
							: stage,
					),
				);
			}
			return;
		}

		await onWorkflowSelected({
			...selectedWorkflow,
			previewStages: selectedEditStages,
			isEditedExistingWorkflow: true,
			saveAsTemplate: selectedWorkflow.saveAsTemplate ?? false,
		});
		setSelectedEditStages(null);
	};

	// Cancel — discard in-progress edits, return to the read-only preview.
	const handleCancelEditCurrentWorkflow = () => {
		setIsEditingCurrentWorkflow(false);
		setStageErrors([]);
		setStageFormError(null);
		onStageEditsChange(null);
	};

	const handleConfirmEditCurrentWorkflow = () => {
		const validation = validateWorkflow(stageEdits ?? []);

		setStageErrors(validation.stageErrors);
		setStageFormError(validation.formError ?? null);

		const hasStageErrors = validation.stageErrors.some(
			(stageError) => Object.keys(stageError).length > 0,
		);

		if (validation.formError || hasStageErrors) {
			if (hasStageErrors) {
				onStageEditsChange(
					(stageEdits ?? []).map((stage, index) =>
						Object.keys(validation.stageErrors[index] || {}).length > 0
							? { ...stage, isExpanded: true }
							: stage,
					),
				);
			}

			return;
		}

		setIsEditingCurrentWorkflow(false);
	};

	const handleUseActiveWorkflow = () => {
		onClearWorkflow();
		onStageEditsChange(null);
		setIsEditingCurrentWorkflow(false);
		setWorkflowSource("active");
	};

	const handleWorkflowSelected = async (
		selection: PendingWorkflowSelection,
	) => {
		setIsEditingCurrentWorkflow(false);
		onStageEditsChange(null);
		setWorkflowSource("selection");
		await onWorkflowSelected(selection);
	};

	// ── WorkflowStagesForm handlers ─────────────────────────────────────────

	const handleStageChange: <K extends keyof WorkflowStage>(
		stageId: string,
		key: K,
		value: WorkflowStage[K],
	) => void = (stageId, key, value) => {
		const updater = (prev: WorkflowStage[]) =>
			prev.map((s) => (s.id === stageId ? { ...s, [key]: value } : s));

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);
	};

	const handleToggleStage = (stageId: string) => {
		// UI-only (expand/collapse) — doesn't need to touch parent state.
		const updater = (stages: WorkflowStage[]) =>
			stages.map((s) =>
				s.id === stageId ? { ...s, isExpanded: !s.isExpanded } : s,
			);

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);
	};

	const handleRemoveApprover = (stageId: string, approverId: string) => {
		const updater = (prev: WorkflowStage[]) =>
			prev.map((s) =>
				s.id === stageId
					? {
							...s,
							approvers: s.approvers.filter((a) => a.id !== approverId),
						}
					: s,
			);

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);
	};

	const handleAddApprover = (stageId: string, approver: WorkflowApprover) => {
		const updater = (prev: WorkflowStage[]) =>
			prev.map((s) =>
				s.id === stageId ? { ...s, approvers: [...s.approvers, approver] } : s,
			);

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);
	};

	const handleAddStage = () => {
		const updater = (prev: WorkflowStage[]) => [
			...prev,
			{
				id: `new-stage-${Date.now()}`,
				name: `Stage ${prev.length + 1}`,
				stageOrder: prev.length + 1,
				strategy: "ANY",
				minApprovals: 1,
				isExpanded: true,
				approvers: [],
			} as WorkflowStage,
		];

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);
	};

	const handleRemoveStage = (stageId: string) => {
		const updater = (prev: WorkflowStage[]) =>
			reindexStages(prev.filter((s) => s.id !== stageId));

		if (isEditingSelectedWorkflow) updateSelectedStages(updater);
		else updateStages(updater);

		setStageErrors([]);
		setStageFormError(null);
	};

	const handleResetStages = () => {
		if (isEditingSelectedWorkflow) {
			setSelectedEditStages([createBlankStage()]);
		} else {
			updateStages(() => [createBlankStage()]);
		}

		setStageErrors([]);
		setStageFormError(null);
	};

	return (
		<div className="workflow-customization-section">
			<div className="workflow-customization-content">
				{showWorkflowPreview ? (
					<div className="workflow-customization-preview">
						<div className="workflow-customization-selection" role="status">
							<div className="workflow-customization-selection-main">
								<span className="workflow-customization-selection-icon">
									<CheckCircle2 size={18} aria-hidden="true" />
								</span>

								<div className="flex gap-2">
									<span>
										{isEditingWorkflow
											? isEditingSelectedWorkflow
												? "Editing selected workflow -"
												: "Editing workflow -"
											: shouldUseActiveWorkflow
												? "Current workflow -"
												: "New workflow: "}
									</span>

									<strong>{workflowName}</strong>

									{!isEditingCurrentWorkflow &&
										!shouldUseActiveWorkflow &&
										isClarificationResubmission && (
											<small className="workflow-customization-selection-note">
												This workflow will replace the current selection when
												the form is resubmitted.
											</small>
										)}
								</div>
							</div>

							{!isEditingWorkflow && (
								<div className="gap-2 flex">
									{canEditActiveWorkflow && shouldUseActiveWorkflow && (
										<Button
											type="button"
											text="Edit workflow"
											size="sm"
											Icon={Pencil}
											iconPosition="left"
											appearance="standard"
											variant="outline"
											onClick={handleEditCurrentWorkflow}
										/>
									)}
									{!shouldUseActiveWorkflow && selectedWorkflow && (
										<Button
											type="button"
											text="Edit workflow"
											size="sm"
											Icon={Pencil}
											iconPosition="left"
											appearance="standard"
											variant="outline"
											onClick={handleEditSelectedWorkflow}
										/>
									)}
									<Button
										type="button"
										text="Reattach workflow"
										size="sm"
										Icon={RefreshCcw}
										iconPosition="left"
										appearance="standard"
										variant="outline"
										onClick={handleChangeWorkflow}
									/>
								</div>
							)}
						</div>

						<div className="workflow-customization-table">
							{isEditingWorkflow ? (
								<WorkflowStagesForm
									stages={
										isEditingSelectedWorkflow
											? (selectedEditStages ?? [])
											: (stageEdits ?? [])
									}
									errors={stageErrors}
									formError={stageFormError}
									currentUserId={currentUserId}
									onStageChange={handleStageChange}
									onToggleStage={handleToggleStage}
									onRemoveApprover={handleRemoveApprover}
									onAddApprover={handleAddApprover}
									onAddStage={handleAddStage}
									onRemoveStage={handleRemoveStage}
									onResetStages={handleResetStages}
									onBack={
										isEditingSelectedWorkflow
											? handleCancelEditSelectedWorkflow
											: handleCancelEditCurrentWorkflow
									}
									onSubmit={
										isEditingSelectedWorkflow
											? () => void handleConfirmEditSelectedWorkflow()
											: handleConfirmEditCurrentWorkflow
									}
								/>
							) : (
								<>
									<ApprovalWorkflowTableContent
										stages={previewStages}
										showEmptyState
									/>

									{selectedWorkflow?.isEditedExistingWorkflow && (
										<div className="workflow-customization-save-template">
											<Checkbox
												name="save-edited-workflow-as-template"
												label="Save these changes as a reusable template"
												checked={selectedWorkflow.saveAsTemplate ?? false}
												onChange={(checked) =>
													void onWorkflowSelected({
														...selectedWorkflow,
														saveAsTemplate: checked,
														templateName: checked
															? selectedWorkflow.templateName
															: undefined,
													})
												}
											/>

											{selectedWorkflow.saveAsTemplate && (
												<FormInput
													name="editedWorkflowTemplateName"
													label="Template name"
													value={selectedWorkflow.templateName ?? ""}
													onChange={(event) =>
														void onWorkflowSelected({
															...selectedWorkflow,
															templateName: event.target.value,
														})
													}
													placeholder="Enter a template name"
													required
												/>
											)}
										</div>
									)}
								</>
							)}
						</div>
					</div>
				) : sourceRecordRef ? (
					<div className="workflow-customization-picker">
						{canUseActiveWorkflow && (
							<div className="workflow-customization-selection">
								<div className="workflow-customization-selection-main">
									<span className="workflow-customization-selection-icon">
										<CheckCircle2 size={18} aria-hidden="true" />
									</span>
									<div className="flex gap-2">
										<span>Current workflow -</span>

										<strong>
											{activeWorkflow?.template?.name ||
												"Active approval workflow"}
										</strong>
									</div>
								</div>

								<Button
									type="button"
									text="Continue with active workflow"
									size="sm"
									Icon={Undo2}
									iconPosition="left"
									appearance="standard"
									variant="outline"
									onClick={handleUseActiveWorkflow}
								/>
							</div>
						)}

						<WorkflowFetchPage
							sourceRecordRef={sourceRecordRef}
							recordType={recordType}
							onWorkflowSelected={handleWorkflowSelected}
							onScreenChange={(view) =>
								setIsCustomisingExistingWorkflow(view === "builder")
							}
						/>
					</div>
				) : (
					<div className="workflow-customization-empty" role="alert">
						A source record is required to select a workflow.
					</div>
				)}
			</div>

			{!isEditingWorkflow && !isCustomisingExistingWorkflow && (
				<div className="workflow-customization-form-actions workflow-customization-navigation">
					<Button
						type="button"
						text="Back"
						size="sm"
						Icon={ArrowLeft}
						iconPosition="left"
						appearance="standard"
						variant="outline"
						onClick={onBack}
					/>

					<div className="workflow-customization-form-actions-end">
						<Button
							type="button"
							text="Next"
							size="sm"
							Icon={ArrowRight}
							iconPosition="right"
							appearance="standard"
							variant="brand"
							onClick={onNext}
							disabled={
								!sourceRecordRef ||
								!hasWorkflow ||
								Boolean(
									selectedWorkflow?.saveAsTemplate &&
									!selectedWorkflow.templateName?.trim(),
								)
							}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomizedWorkflowSection;
