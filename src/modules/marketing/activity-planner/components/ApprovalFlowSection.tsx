import { useMemo } from "react";
import ApprovalTable from "./ApprovalTable";
import type { WorkflowStage } from "../types/workflow.types";
import { mapWorkflowStagesToApprovalRows } from "../utils/approvalTable.mapper";

type ApprovalFlowSectionProps = {
	stages: WorkflowStage[];
	deviationPreviewStages?: WorkflowStage[];
};

const ApprovalFlowSection = ({
	stages,
	deviationPreviewStages = [],
}: ApprovalFlowSectionProps) => {
	const approvalRows = useMemo(() => {
		return mapWorkflowStagesToApprovalRows(stages, {
			showOnlyCurrentStageStatus: true,
		});
	}, [stages]);

	const deviationApprovalRows = useMemo(() => {
		return mapWorkflowStagesToApprovalRows(deviationPreviewStages, {
			showOnlyCurrentStageStatus: true,
		});
	}, [deviationPreviewStages]);

	return (
		<>
			<ApprovalTable data={approvalRows} stages={stages} />

			{deviationApprovalRows.length > 0 && (
				<div className="mt-6">
					<div className="px-3">
						<h3 className="text-sm font-semibold text-gray-700">
							Deviation Approval Flow
						</h3>

						<p className="mt-1 text-xs text-gray-500">
							Approval flow generated for the updated deviated amount.
						</p>
					</div>

					<ApprovalTable
						data={deviationApprovalRows}
						stages={deviationPreviewStages}
					/>
				</div>
			)}
		</>
	);
};

export default ApprovalFlowSection;
