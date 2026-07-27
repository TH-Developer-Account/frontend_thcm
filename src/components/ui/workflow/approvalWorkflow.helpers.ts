import type {
	ApprovalLike,
	ApprovalStageLike,
	WorkflowPersonLike,
} from "./approvalWorkflow.types";

export const normalizeWorkflowStatus = (value?: string | null): string => {
	return String(value ?? "")
		.trim()
		.toUpperCase();
};

export const getApprovalUser = (
	approval: ApprovalLike,
): WorkflowPersonLike | null | undefined => {
	return approval.approver ?? approval.user;
};

export const getCurrentApprovalStage = <TStage extends ApprovalStageLike>(
	stages: readonly TStage[] = [],
): TStage | undefined => {
	return stages.find((stage) => {
		if (stage.isCurrentIteration !== true) {
			return false;
		}

		const status = normalizeWorkflowStatus(stage.status);

		return status === "IN_PROGRESS" || status === "CLARIFY";
	});
};

export const getApprovalIdForUser = (
	stages: readonly ApprovalStageLike[] = [],
	userId?: string | null,
): string | null => {
	if (!userId) return null;

	const currentStage = getCurrentApprovalStage(stages);

	const approval = currentStage?.approvals?.find(
		(item) =>
			item.approverId === userId ||
			item.approver?.id === userId ||
			item.user?.id === userId,
	);

	return approval?.id ?? null;
};

export const getIsUserInCurrentStage = (
	stages: readonly ApprovalStageLike[] = [],
	userId?: string | null,
): boolean => {
	return Boolean(getApprovalIdForUser(stages, userId));
};

export const getCanActOnCurrentStage = ({
	stages,
	userId,
}: {
	stages: readonly ApprovalStageLike[];
	userId?: string | null;
}): boolean => {
	if (!userId) return false;

	return getIsUserInCurrentStage(stages, userId);
};
