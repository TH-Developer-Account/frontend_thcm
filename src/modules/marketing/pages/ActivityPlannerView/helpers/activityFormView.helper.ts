import type { EpcWorkflowStage } from "../types/ActivityView.types";

export const getApprovalStrategyLabel = (stage: EpcWorkflowStage) => {
	const approverCount = stage.approvals?.length ?? 0;
	const minApprovals = stage.minApprovals ?? null;

	if (approverCount <= 1) {
		return "Sequential";
	}

	if (approverCount > 1 && minApprovals === approverCount) {
		return "All Approvers Required";
	}

	if (approverCount > 1 && minApprovals !== approverCount) {
		return "Parallel";
	}

	return "--";
};
