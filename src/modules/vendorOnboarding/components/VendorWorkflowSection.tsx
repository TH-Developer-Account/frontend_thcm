import { useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCcw, Undo2 } from "lucide-react";

import Button from "../../../components/common/Button";
import { ApprovalWorkflowTableContent } from "../../workflows";
import { WorkflowFetchPage } from "../../workflows/pages/WorkflowFetchPage";

import type {
	ApprovalStageLike,
	PendingWorkflowSelection,
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
}: VendorWorkflowSectionProps) => {
	/*
	 * Clarification starts by previewing the existing active workflow.
	 * The user can explicitly switch to workflow selection.
	 */
	const [workflowSource, setWorkflowSource] =
		useState<WorkflowSource>("active");

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
		? activeWorkflowStages
		: selectedWorkflowStages;

	const workflowName = shouldUseActiveWorkflow
		? activeWorkflow?.template?.name || "Active approval workflow"
		: selectedWorkflow?.name || "Selected workflow";

	const hasWorkflow = shouldUseActiveWorkflow
		? activeWorkflowStages.length > 0
		: Boolean(selectedWorkflow && selectedWorkflowStages.length > 0);

	const showWorkflowPreview =
		shouldUseActiveWorkflow || Boolean(selectedWorkflow);

	const handleChangeWorkflow = () => {
		/*
		 * This clears only the pending selection. It does not delete or
		 * modify the active workflow.
		 */
		onClearWorkflow();
		setWorkflowSource("selection");
	};

	const handleUseActiveWorkflow = () => {
		onClearWorkflow();
		setWorkflowSource("active");
	};

	const handleWorkflowSelected = async (
		selection: PendingWorkflowSelection,
	) => {
		setWorkflowSource("selection");
		await onWorkflowSelected(selection);
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
										{shouldUseActiveWorkflow
											? "Current active workflow"
											: "New selected workflow"}
									</span>

									<strong>{workflowName}</strong>

									{shouldUseActiveWorkflow && (
										<small className="vendor-workflow-selection-note">
											Continue with this workflow or select a different one for
											resubmission.
										</small>
									)}

									{!shouldUseActiveWorkflow && isClarificationResubmission && (
										<small className="vendor-workflow-selection-note">
											This workflow will replace the current selection when the
											form is resubmitted.
										</small>
									)}
								</div>
							</div>

							<Button
								type="button"
								text="Change workflow"
								size="sm"
								Icon={RefreshCcw}
								iconPosition="left"
								appearance="standard"
								variant="outline"
								onClick={handleChangeWorkflow}
							/>
						</div>

						<div className="vendor-workflow-table">
							<ApprovalWorkflowTableContent
								stages={previewStages}
								showEmptyState
							/>
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
		</div>
	);
};

export default VendorWorkflowSection;
