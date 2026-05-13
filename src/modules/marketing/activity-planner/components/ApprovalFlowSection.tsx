import { useMemo } from "react";
import Section from "./Section";
import ApprovalTable from "../../../../components/ui/ApprovalTable";
import type { ApprovalTableRow } from "../../../../utils/types";
import type { EpcWorkflowStage } from "../types/workflow.types";
import { getApprovalStrategyLabel } from "../utils/formatters";

type ApprovalFlowSectionProps = {
	stages: EpcWorkflowStage[];
};

const ApprovalFlowSection = ({ stages }: ApprovalFlowSectionProps) => {
	const approvalRows = useMemo<ApprovalTableRow[]>(() => {
		return stages.flatMap((stage) =>
			stage.approvals.map((approval) => ({
				id: approval.id,
				stageOrder: stage.stageOrder,
				name: `${approval.approver?.first_name ?? ""} ${
					approval.approver?.last_name ?? ""
				}`.trim(),
				email: approval.approver?.email ?? "--",
				stageName: stage.stageName ?? `Stage ${stage.stageOrder}`,
				strategy: getApprovalStrategyLabel(stage),
				status: approval.status ?? stage.status ?? "--",
			})),
		);
	}, [stages]);

	return (
		<Section title="Approval Flow">
			<ApprovalTable data={approvalRows} stages={stages} />
		</Section>
	);
};

export default ApprovalFlowSection;
