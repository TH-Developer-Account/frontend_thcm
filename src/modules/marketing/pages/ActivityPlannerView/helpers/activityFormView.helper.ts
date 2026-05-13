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

export const isClarificationStatus = (status?: string | null) => {
	const normalized = String(status ?? "").toUpperCase();

	return [
		"CLARIFIED",
		"CLARIFY",
		"SENT_BACK",
		"SENT BACK",
		"PENDING_CLARIFICATION",
		"RETURNED",
	].includes(normalized);
};

export const isClarificationModeForEpc = (epcData: any) => {
	return (
		isClarificationStatus(epcData?.status) ||
		isClarificationStatus(epcData?.activeWorkflow?.status)
	);
};
