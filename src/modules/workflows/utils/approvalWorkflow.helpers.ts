import type {
	ApprovalStageLike,
	WorkflowApprovalLike,
	WorkflowStage,
	WorkflowUser,
} from "../types/types";
import { normalizeWorkflowStatus } from "./status";

export const getApprovalUser = (
	approval: WorkflowApprovalLike,
): WorkflowUser | null | undefined => approval.approver ?? approval.user;

export const getCurrentApprovalStage = <TStage extends ApprovalStageLike>(
	stages: readonly TStage[] = [],
): TStage | undefined =>
	stages.find((stage) => {
		if (stage.isCurrentIteration !== true) return false;

		const status = normalizeWorkflowStatus(stage.status);
		return status === "IN_PROGRESS" || status === "CLARIFY";
	});

export const getApprovalIdForUser = (
	stages: readonly ApprovalStageLike[] = [],
	userId?: string | null,
): string | null => {
	if (!userId) return null;

	const approval = getCurrentApprovalStage(stages)?.approvals?.find(
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
): boolean => Boolean(getApprovalIdForUser(stages, userId));

export const getCanActOnCurrentStage = ({
	stages,
	userId,
}: {
	stages: readonly ApprovalStageLike[];
	userId?: string | null;
}): boolean => Boolean(userId && getIsUserInCurrentStage(stages, userId));
