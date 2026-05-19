import { useMemo } from "react";
import Section from "./Section";
import ApprovalTable from "./ApprovalTable";
import type { WorkflowStage } from "../types/workflow.types";
import { mapWorkflowStagesToApprovalRows } from "../utils/approvalTable.mapper";

type ApprovalFlowSectionProps = {
	stages: WorkflowStage[];
};

const ApprovalFlowSection = ({ stages }: ApprovalFlowSectionProps) => {
	const approvalRows = useMemo(() => {
		return mapWorkflowStagesToApprovalRows(stages, {
			showOnlyCurrentStageStatus: true,
		});
	}, [stages]);

	return (
		<Section title="Approval Flow">
			<ApprovalTable data={approvalRows} stages={stages} />
		</Section>
	);
};

export default ApprovalFlowSection;
