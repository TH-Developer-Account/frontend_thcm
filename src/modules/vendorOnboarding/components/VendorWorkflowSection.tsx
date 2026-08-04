import { ArrowLeft, CheckCircle2, RefreshCcw } from "lucide-react";

import Button from "../../../components/common/Button";
import { ApprovalWorkflowTableContent } from "../../workflows";
import { WorkflowFetchPage } from "../../workflows/pages/WorkflowFetchPage";
import type {
	ApprovalStageLike,
	PendingWorkflowSelection,
} from "../../workflows/types/types";

type VendorWorkflowSectionProps = {
	sourceRecordRef?: string;
	recordType: string;
	selectedWorkflow: PendingWorkflowSelection | null;
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

const getPreviewStages = (
	selection: PendingWorkflowSelection | null,
): ApprovalStageLike[] => {
	if (!selection) return [];

	const preview = selection as SelectionWithPreview;

	if (Array.isArray(preview.previewStages)) return preview.previewStages;
	if (Array.isArray(preview.stages)) return preview.stages;
	if (Array.isArray(preview.workflow?.stages)) return preview.workflow.stages;

	return [];
};

const VendorWorkflowSection = ({
	sourceRecordRef,
	recordType,
	selectedWorkflow,
	onWorkflowSelected,
	onClearWorkflow,
	onBack,
	onNext,
}: VendorWorkflowSectionProps) => {
	const previewStages = getPreviewStages(selectedWorkflow);

	return (
		<div className="vendor-workflow-section">
			{selectedWorkflow ? (
				<div className="vendor-workflow-preview">
					<div className="vendor-workflow-selection" role="status">
						<div>
							<CheckCircle2 size={18} aria-hidden="true" />
							<span>
								<strong>{selectedWorkflow.name}</strong> selected
							</span>
						</div>

						<Button
							type="button"
							text="Change workflow"
							size="sm"
							Icon={RefreshCcw}
							iconPosition="left"
							appearance="standard"
							variant="outline"
							onClick={onClearWorkflow}
						/>
					</div>

					<ApprovalWorkflowTableContent stages={previewStages} showEmptyState />
				</div>
			) : sourceRecordRef ? (
				<WorkflowFetchPage
					sourceRecordRef={sourceRecordRef}
					recordType={recordType}
					onWorkflowSelected={onWorkflowSelected}
				/>
			) : (
				<div role="alert">
					A source record is required to select a workflow.
				</div>
			)}

			<div className="vendor-onboarding-form-actions">
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
						disabled={!sourceRecordRef || !selectedWorkflow}
					/>
				</div>
			</div>
		</div>
	);
};

export default VendorWorkflowSection;
