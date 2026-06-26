import { useMemo } from "react";

import SectionAccordion from "../../../../../components/common/SectionAccordion";
import ApprovalTable from "../../components/activityFormView/ApprovalTable";

import type { WorkflowStage } from "../../types/workflow.types";
import { mapWorkflowStagesToApprovalRows } from "../../utils/approvalTable.mapper";

type ApprovalWorkflowSectionProps = {
	stages: WorkflowStage[];
	deviationPreviewStages?: WorkflowStage[];

	/**
	 * Retained temporarily for compatibility with existing callers.
	 * Remove it from this type and parent call sites if it is genuinely unused.
	 */
	onWorkflowUpdate?: () => Promise<void>;
};

const ApprovalWorkflowSection = ({
	stages,
	deviationPreviewStages = [],
}: ApprovalWorkflowSectionProps) => {
	const approvalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(stages, {
				showOnlyCurrentStageStatus: true,
			}),
		[stages],
	);

	const deviationApprovalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(deviationPreviewStages, {
				showOnlyCurrentStageStatus: true,
			}),
		[deviationPreviewStages],
	);

	const hasStandardFlow = approvalRows.length > 0;
	const hasDeviationFlow = deviationApprovalRows.length > 0;

	return (
		<SectionAccordion title="Approval Flow">
			<div className="approval-workflow-content">
				{hasStandardFlow ? (
					<ApprovalTable
						// title="Standard Approval Flow"
						// subtitle={`${approvalRows.length} ${
						// 	approvalRows.length === 1 ? "stage" : "stages"
						// }`}
						data={approvalRows}
					/>
				) : null}

				{hasDeviationFlow ? (
					<ApprovalTable
						title="Deviation Approval Flow"
						subtitle="Approval flow generated for the updated deviated amount."
						data={deviationApprovalRows}
					/>
				) : null}

				{!hasStandardFlow && !hasDeviationFlow ? (
					<div className="approval-workflow-empty">
						<p className="approval-workflow-empty-title">
							No approval flow available
						</p>

						<p className="approval-workflow-empty-description">
							The approval workflow will appear here after it has been
							generated.
						</p>
					</div>
				) : null}
			</div>
		</SectionAccordion>
	);
};

export default ApprovalWorkflowSection;
