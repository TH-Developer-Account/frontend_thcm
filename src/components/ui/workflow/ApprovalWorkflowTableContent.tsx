import { useMemo } from "react";

import ApprovalTable from "./ApprovalTable";
import { mapWorkflowStagesToApprovalRows } from "./approvalWorkflow.mapper";
import type { ApprovalStageLike } from "./approvalWorkflow.types";

type ApprovalWorkflowTableContentProps = {
	stages: ApprovalStageLike[];
	deviationPreviewStages?: ApprovalStageLike[];
	showEmptyState?: boolean;
};

const ApprovalWorkflowTableContent = ({
	stages,
	deviationPreviewStages = [],
	showEmptyState = true,
}: ApprovalWorkflowTableContentProps) => {
	const approvalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(stages, {
				showOnlyCurrentStageStatus: true,
			}),
		[stages],
	);

	const deviationRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(deviationPreviewStages, {
				showOnlyCurrentStageStatus: true,
			}),
		[deviationPreviewStages],
	);

	const hasApprovalFlow = approvalRows.length > 0;
	const hasDeviationFlow = deviationRows.length > 0;

	if (!hasApprovalFlow && !hasDeviationFlow) {
		if (!showEmptyState) {
			return null;
		}

		return (
			<div className="approval-workflow-empty">
				<p className="approval-workflow-empty-title">
					No approval flow available
				</p>

				<p className="approval-workflow-empty-description">
					The approval workflow will appear here after it has been generated.
				</p>
			</div>
		);
	}

	return (
		<div className="approval-workflow-content">
			{hasApprovalFlow ? <ApprovalTable data={approvalRows} /> : null}

			{hasDeviationFlow ? (
				<ApprovalTable
					title="Deviation Approval Flow"
					subtitle="Approval flow generated for the updated deviated amount."
					data={deviationRows}
				/>
			) : null}
		</div>
	);
};

export default ApprovalWorkflowTableContent;
