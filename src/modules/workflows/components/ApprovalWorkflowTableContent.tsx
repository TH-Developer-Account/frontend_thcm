import { useMemo } from "react";

import type { ApprovalStageLike } from "../types/types";
import { mapWorkflowStagesToApprovalRows } from "../utils/approvalWorkflow.mapper";
import { ApprovalTable } from "./ApprovalTable";

export type ApprovalWorkflowTableContentProps = {
	stages: ApprovalStageLike[];
	additionalFlows?: ApprovalWorkflowFlowGroup[];
	showEmptyState?: boolean;
};

export type ApprovalWorkflowFlowGroup = {
	key: string;
	title: string;
	subtitle?: string;
	stages: ApprovalStageLike[];
};

export const ApprovalWorkflowTableContent = ({
	stages,
	additionalFlows = [],
	showEmptyState = true,
}: ApprovalWorkflowTableContentProps) => {
	const approvalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(stages, {
				showOnlyCurrentStageStatus: true,
			}),
		[stages],
	);

	const additionalFlowRows = useMemo(
		() =>
			additionalFlows.map((flow) => ({
				...flow,
				rows: mapWorkflowStagesToApprovalRows(flow.stages, {
					showOnlyCurrentStageStatus: true,
				}),
			})),
		[additionalFlows],
	);

	const hasApprovalFlow = approvalRows.length > 0;
	const visibleAdditionalFlows = additionalFlowRows.filter(
		(flow) => flow.rows.length > 0,
	);

	if (!hasApprovalFlow && visibleAdditionalFlows.length === 0) {
		if (!showEmptyState) return null;

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

			{visibleAdditionalFlows.map((flow) => (
				<ApprovalTable
					key={flow.key}
					title={flow.title}
					subtitle={flow.subtitle}
					data={flow.rows}
				/>
			))}
		</div>
	);
};
