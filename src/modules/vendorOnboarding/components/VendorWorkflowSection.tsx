import { useState } from "react";
import {
	ArrowLeft,
	CheckCircle2,
	Pencil,
	RefreshCcw,
	Undo2,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { ApprovalWorkflowTableContent } from "../../workflows";
import { WorkflowFetchPage } from "../../workflows/pages/WorkflowFetchPage";
import WorkflowStagesForm from "../../workflows/components/WorkflowStagesForm"; // adjust path if different

import type {
	ApprovalStageLike,
	PendingWorkflowSelection,
	WorkflowStage,
	WorkflowApprover,
	WorkflowStageErrors,
} from "../../workflows/types/types";

import type { VendorActiveWorkflow } from "../types/vendorOnboarding.types";

type WorkflowSource = "active" | "selection";

type VendorWorkflowSectionProps = {
	sourceRecordRef?: string;
	recordType: string;

	selectedWorkflow: PendingWorkflowSelection | null;

	activeWorkflow?: VendorActiveWorkflow | null;

	isClarificationResubmission?: boolean;

	onWorkflowSelected: (
		selection: PendingWorkflowSelection,
	) => void | Promise<void>;

	onClearWorkflow: () => void;
	onBack: () => void;
	onNext: () => void;

	// ── Direct edit of the ACTIVE workflow's stages ("Edit current workflow") ──
	// Distinct from onWorkflowSelected — this never touches pendingWorkflowSelection,
	// it feeds the hook's separate stageEdits state (→ sent as `stageEdits` on submit).
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

// ─────────────────────────────────────────────────────────────────────────
// Converts the active workflow's read-only ApprovalStageLike[] (fetched
// shape — approvals: [{ approver: { id, first_name, last_name, email },
// isExternalApprover }]) into WorkflowStagesForm's editable WorkflowStage[]
// shape. ASSUMPTION: field names below match the approver payload shape
// used by getWorkflowController/getWorkflowHistoryController — adjust if
// ApprovalStageLike's actual generated type differs.
// ─────────────────────────────────────────────────────────────────────────
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
const VendorWorkflowSection = ({
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
}: VendorWorkflowSectionProps) => {
	/*
	 * Clarification starts by previewing the existing active workflow.
	 * The user can explicitly switch to workflow selection.
	 */
	const [workflowSource, setWorkflowSource] =
		useState<WorkflowSource>("active");

	// "Edit current workflow" — direct in-place stage edit of the ACTIVE
	// workflow. Mutually exclusive with the selection flow: entering this
	// mode never sets pendingWorkflowSelection, and "Change current
	// workflow" always exits this mode.
	const [isEditingCurrentWorkflow, setIsEditingCurrentWorkflow] =
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

	// Every mutation goes through this so parent's stageEdits (the payload
	// source of truth) and local render state never drift apart.
	const updateStages = (
		updater: (prev: WorkflowStage[]) => WorkflowStage[],
	) => {
		const next = updater(stageEdits ?? []);
		onStageEditsChange(next);
	};

	// ── "Change current workflow" → go pick/build a different one ──────────
	const handleChangeWorkflow = () => {
		/*
		 * This clears only the pending selection. It does not delete or
		 * modify the active workflow.
		 */
		setIsEditingCurrentWorkflow(false);
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
		setStageFormError(null);
		onStageEditsChange(mapActiveStagesToEditable(activeWorkflowStages));
		setIsEditingCurrentWorkflow(true);
	};

	// Cancel — discard in-progress edits, return to the read-only preview.
	const handleCancelEditCurrentWorkflow = () => {
		setIsEditingCurrentWorkflow(false);
		onStageEditsChange(null);
	};

	// Confirm — edits already synced live via updateStages; just collapse
	// back to the preview. Submission itself happens later via the outer
	// form's "Next"/"Submit" action.
	const handleConfirmEditCurrentWorkflow = () => {
		if (!stageEdits?.length) {
			setStageFormError("Add at least one stage before continuing.");
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
		updateStages((prev) =>
			prev.map((s) => (s.id === stageId ? { ...s, [key]: value } : s)),
		);
	};

	const handleToggleStage = (stageId: string) => {
		// UI-only (expand/collapse) — doesn't need to touch parent state.
		onStageEditsChange(
			(stageEdits ?? []).map((s) =>
				s.id === stageId ? { ...s, isExpanded: !s.isExpanded } : s,
			),
		);
	};

	const handleRemoveApprover = (stageId: string, approverId: string) => {
		updateStages((prev) =>
			prev.map((s) =>
				s.id === stageId
					? {
							...s,
							approvers: s.approvers.filter((a) => a.id !== approverId),
						}
					: s,
			),
		);
	};

	const handleAddApprover = (stageId: string, approver: WorkflowApprover) => {
		updateStages((prev) =>
			prev.map((s) =>
				s.id === stageId ? { ...s, approvers: [...s.approvers, approver] } : s,
			),
		);
	};

	const handleAddStage = () => {
		updateStages((prev) => [
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
		]);
	};

	return (
		<div className="vendor-workflow-section">
			<div className="vendor-workflow-content">
				{showWorkflowPreview ? (
					<div className="vendor-workflow-preview">
						<div className="vendor-workflow-selection" role="status">
							<div className="vendor-workflow-selection-main">
								<span className="vendor-workflow-selection-icon">
									<CheckCircle2 size={18} aria-hidden="true" />
								</span>

								<div className="vendor-workflow-selection-copy">
									<span>
										{isEditingCurrentWorkflow
											? "Editing current workflow"
											: shouldUseActiveWorkflow
												? "Current active workflow"
												: "New selected workflow"}
									</span>

									<strong>{workflowName}</strong>

									{isEditingCurrentWorkflow && (
										<small className="vendor-workflow-selection-note">
											Changes apply directly to the active workflow's stages
											when resubmitted.
										</small>
									)}

									{!isEditingCurrentWorkflow && shouldUseActiveWorkflow && (
										<small className="vendor-workflow-selection-note">
											Continue with this workflow, edit its stages, or select a
											different one for resubmission.
										</small>
									)}

									{!isEditingCurrentWorkflow &&
										!shouldUseActiveWorkflow &&
										isClarificationResubmission && (
											<small className="vendor-workflow-selection-note">
												This workflow will replace the current selection when
												the form is resubmitted.
											</small>
										)}
								</div>
							</div>

							{!isEditingCurrentWorkflow && (
								<div className="gap-2 flex">
									{canEditActiveWorkflow && shouldUseActiveWorkflow && (
										<Button
											type="button"
											text="Edit current workflow"
											size="sm"
											Icon={Pencil}
											iconPosition="left"
											appearance="standard"
											variant="outline"
											onClick={handleEditCurrentWorkflow}
										/>
									)}
									<Button
										type="button"
										text="Change current workflow"
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

						<div className="vendor-workflow-table">
							{isEditingCurrentWorkflow ? (
								<WorkflowStagesForm
									stages={stageEdits ?? []}
									errors={stageErrors}
									formError={stageFormError}
									currentUserId={currentUserId}
									onStageChange={handleStageChange}
									onToggleStage={handleToggleStage}
									onRemoveApprover={handleRemoveApprover}
									onAddApprover={handleAddApprover}
									onAddStage={handleAddStage}
									onBack={handleCancelEditCurrentWorkflow}
									onSubmit={handleConfirmEditCurrentWorkflow}
								/>
							) : (
								<ApprovalWorkflowTableContent
									stages={previewStages}
									showEmptyState
								/>
							)}
						</div>
					</div>
				) : sourceRecordRef ? (
					<div className="vendor-workflow-picker">
						{canUseActiveWorkflow && (
							<div className="vendor-workflow-existing-option">
								<div>
									<strong>Current active workflow</strong>

									<span>
										{activeWorkflow?.template?.name ||
											"Active approval workflow"}
									</span>
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
						/>
					</div>
				) : (
					<div className="vendor-workflow-empty" role="alert">
						A source record is required to select a workflow.
					</div>
				)}
			</div>

			{!isEditingCurrentWorkflow && (
				<div className="vendor-onboarding-form-actions vendor-workflow-navigation">
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

					<div className="vendor-onboarding-form-actions-end">
						<Button
							type="button"
							text="Next"
							size="sm"
							appearance="standard"
							variant="brand"
							onClick={onNext}
							disabled={!sourceRecordRef || !hasWorkflow}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default VendorWorkflowSection;
