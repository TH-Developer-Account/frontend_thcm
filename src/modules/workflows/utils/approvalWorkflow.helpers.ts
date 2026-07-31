import { normalizeWorkflowStatus } from "./status";

export type WorkflowStagePosition = "PAST" | "CURRENT" | "FUTURE";

export type WorkflowUserIdentity = {
	id?: string | null;
	email?: string | null;
	name?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	first_name?: string | null;
	last_name?: string | null;
};

export type WorkflowApprovalLike<
	TUser extends WorkflowUserIdentity = WorkflowUserIdentity,
> = {
	id?: string | null;
	approverId?: string | null;
	userId?: string | null;
	status?: string | null;
	isExternalApprover?: boolean | null;
	approver?: TUser | null;
	user?: TUser | null;
};

export type ApprovalStageLike<
	TApproval extends WorkflowApprovalLike = WorkflowApprovalLike,
> = {
	id?: string | null;
	stageOrder: number;
	stageName?: string | null;
	name?: string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;
	approvals?: readonly TApproval[] | null;
};

export type ActiveWorkflowLike<
	TStage extends ApprovalStageLike = ApprovalStageLike,
> = {
	id?: string | null;
	iteration?: number | null;
	isActive?: boolean | null;
	status?: string | null;
	currentStage?: number | null;
	stages?: readonly TStage[] | null;
};

export type WorkflowApprovalEntry<
	TStage extends ApprovalStageLike,
	TApproval extends WorkflowApprovalLike,
> = {
	stage: TStage;
	approval: TApproval;
	user: TApproval["approver"] | TApproval["user"] | null | undefined;
	position: WorkflowStagePosition;
};

const ACTIONABLE_STAGE_STATUSES = new Set(["IN_PROGRESS", "CLARIFY"]);

const PAST_STAGE_STATUSES = new Set([
	"APPROVED",
	"COMPLETED",
	"REJECTED",
	"CLARIFIED",
	"SKIPPED",
	"CANCELLED",
]);

const TERMINAL_WORKFLOW_STATUSES = new Set([
	"APPROVED",
	"COMPLETED",
	"REJECTED",
	"CANCELLED",
	"CLOSED",
]);

const normalizeUserValue = (value: unknown): string =>
	String(value ?? "")
		.trim()
		.toLowerCase();

export const getApprovalUser = <TApproval extends WorkflowApprovalLike>(
	approval: TApproval,
): TApproval["approver"] | TApproval["user"] | null | undefined =>
	approval.approver ?? approval.user;

export const isSameWorkflowUser = (
	first?: WorkflowUserIdentity | null,
	second?: WorkflowUserIdentity | null,
): boolean => {
	const firstId = normalizeUserValue(first?.id);
	const secondId = normalizeUserValue(second?.id);

	if (firstId && secondId && firstId === secondId) {
		return true;
	}

	const firstEmail = normalizeUserValue(first?.email);
	const secondEmail = normalizeUserValue(second?.email);

	return Boolean(firstEmail && secondEmail && firstEmail === secondEmail);
};

const getStagePosition = (
	stage: ApprovalStageLike,
	currentStageOrder?: number | null,
): WorkflowStagePosition => {
	if (stage.isCurrentIteration === false) {
		return "PAST";
	}

	if (currentStageOrder != null) {
		if (stage.stageOrder < currentStageOrder) return "PAST";
		if (stage.stageOrder > currentStageOrder) return "FUTURE";
		return "CURRENT";
	}

	const status = normalizeWorkflowStatus(stage.status);

	if (ACTIONABLE_STAGE_STATUSES.has(status)) {
		return "CURRENT";
	}

	return PAST_STAGE_STATUSES.has(status) ? "PAST" : "FUTURE";
};

const getUniqueUsers = <
	TUser extends WorkflowUserIdentity,
	TApproval extends WorkflowApprovalLike<TUser>,
	TStage extends ApprovalStageLike<TApproval>,
>(
	entries: readonly WorkflowApprovalEntry<TStage, TApproval>[],
): TUser[] => {
	const users: TUser[] = [];

	entries.forEach(({ user }) => {
		if (!user || (!user.id && !user.email)) {
			return;
		}

		if (users.some((existingUser) => isSameWorkflowUser(existingUser, user))) {
			return;
		}

		users.push(user as TUser);
	});

	return users;
};

/**
 * Legacy compatibility helper.
 * Returns the actionable stage from the current workflow iteration.
 */
export const getCurrentApprovalStage = <TStage extends ApprovalStageLike>(
	stages: readonly TStage[] = [],
): TStage | undefined =>
	stages.find((stage) => {
		if (stage.isCurrentIteration !== true) {
			return false;
		}

		const status = normalizeWorkflowStatus(stage.status);

		return status === "IN_PROGRESS" || status === "CLARIFY";
	});

/**
 * Legacy compatibility helper.
 * Returns the current-stage approval ID for a user.
 */
export const getApprovalIdForUser = (
	stages: readonly ApprovalStageLike[] = [],
	userId?: string | null,
): string | null => {
	if (!userId) {
		return null;
	}

	const approval = getCurrentApprovalStage(stages)?.approvals?.find(
		(item) =>
			item.approverId === userId ||
			item.approver?.id === userId ||
			item.user?.id === userId,
	);

	return approval?.id ?? null;
};

/**
 * Legacy compatibility helper.
 * Checks whether the user is an approver in the current stage.
 */
export const getIsUserInCurrentStage = (
	stages: readonly ApprovalStageLike[] = [],
	userId?: string | null,
): boolean => Boolean(getApprovalIdForUser(stages, userId));

/**
 * Legacy compatibility helper.
 *
 * This intentionally preserves the old behavior: the user can act when they
 * have an approval entry in the current stage.
 *
 * For stricter workflow permission checking, use
 * getWorkflowApproverData(activeWorkflow, user).canActNow.
 */
export const getCanActOnCurrentStage = ({
	stages,
	userId,
}: {
	stages: readonly ApprovalStageLike[];
	userId?: string | null;
}): boolean => Boolean(userId && getIsUserInCurrentStage(stages, userId));

/**
 * Extracts the complete approval state from an active workflow.
 *
 * Pass a user to also receive that user's past, current, and future approval
 * records and ready-to-use permission/status flags.
 */
export const getWorkflowApproverData = <
	TUser extends WorkflowUserIdentity,
	TApproval extends WorkflowApprovalLike<TUser>,
	TStage extends ApprovalStageLike<TApproval>,
>(
	activeWorkflow?: ActiveWorkflowLike<TStage> | null,
	user?: WorkflowUserIdentity | null,
) => {
	const stages = [...(activeWorkflow?.stages ?? [])].sort((first, second) => {
		if (first.isCurrentIteration !== second.isCurrentIteration) {
			return first.isCurrentIteration === false ? -1 : 1;
		}

		return first.stageOrder - second.stageOrder;
	});

	const stageEntries = stages.map((stage) => ({
		stage,
		position: getStagePosition(stage, activeWorkflow?.currentStage),
	}));

	const pastStages = stageEntries
		.filter(({ position }) => position === "PAST")
		.map(({ stage }) => stage);

	const currentStage = stageEntries.find(
		({ position }) => position === "CURRENT",
	)?.stage;

	const futureStages = stageEntries
		.filter(({ position }) => position === "FUTURE")
		.map(({ stage }) => stage);

	const allApprovals: WorkflowApprovalEntry<TStage, TApproval>[] =
		stageEntries.flatMap(({ stage, position }) =>
			(stage.approvals ?? []).map((approval) => ({
				stage,
				approval,
				user: getApprovalUser(approval),
				position,
			})),
		);

	const pastApprovals = allApprovals.filter(
		({ position }) => position === "PAST",
	);

	const currentApprovals = allApprovals.filter(
		({ position }) => position === "CURRENT",
	);

	const futureApprovals = allApprovals.filter(
		({ position }) => position === "FUTURE",
	);

	const allUsers = getUniqueUsers(allApprovals);
	const pastUsers = getUniqueUsers(pastApprovals);
	const currentUsers = getUniqueUsers(currentApprovals);
	const futureUsers = getUniqueUsers(futureApprovals);

	const userApprovals = user
		? allApprovals.filter(({ user: approvalUser }) =>
				isSameWorkflowUser(approvalUser, user),
			)
		: [];

	const pastUserApprovals = userApprovals.filter(
		({ position }) => position === "PAST",
	);

	const currentUserApprovals = userApprovals.filter(
		({ position }) => position === "CURRENT",
	);

	const futureUserApprovals = userApprovals.filter(
		({ position }) => position === "FUTURE",
	);

	const currentUserApprovalEntry =
		currentUserApprovals.find(
			({ approval }) => normalizeWorkflowStatus(approval.status) === "PENDING",
		) ?? currentUserApprovals[0];

	const currentUserApproval = currentUserApprovalEntry?.approval;
	const currentApprovalStatus = normalizeWorkflowStatus(
		currentUserApproval?.status,
	);

	const hasStatus = (status: string): boolean =>
		userApprovals.some(
			({ approval }) => normalizeWorkflowStatus(approval.status) === status,
		);

	const currentStageStatus = normalizeWorkflowStatus(currentStage?.status);
	const workflowStatus = normalizeWorkflowStatus(activeWorkflow?.status);

	const isCurrentStageActionable =
		!currentStageStatus || ACTIONABLE_STAGE_STATUSES.has(currentStageStatus);

	const isWorkflowActionable =
		activeWorkflow?.isActive !== false &&
		(!workflowStatus || !TERMINAL_WORKFLOW_STATUSES.has(workflowStatus));

	const isCurrentStageApprover = currentUserApprovals.length > 0;
	const hasPendingCurrentApproval = currentUserApprovals.some(
		({ approval }) => normalizeWorkflowStatus(approval.status) === "PENDING",
	);

	return {
		stages,
		pastStages,
		currentStage,
		futureStages,

		allApprovals,
		pastApprovals,
		currentApprovals,
		futureApprovals,

		allUsers,
		pastUsers,
		currentUsers,
		futureUsers,

		// Mentions include every unique approver from every workflow stage.
		mentionableUsers: allUsers,

		userApprovals,
		pastUserApprovals,
		currentUserApprovals,
		futureUserApprovals,
		currentUserApprovalEntry,
		currentUserApproval,
		currentApprovalStatus,

		isPartOfWorkflow: userApprovals.length > 0,
		isWorkflowApprover: userApprovals.length > 0,
		isPastStageApprover: pastUserApprovals.length > 0,
		isCurrentStageApprover,
		isFutureStageApprover: futureUserApprovals.length > 0,

		canActNow:
			isWorkflowActionable &&
			isCurrentStageActionable &&
			hasPendingCurrentApproval,

		hasApproved: hasStatus("APPROVED"),
		hasRejected: hasStatus("REJECTED"),
		hasPendingApproval: hasStatus("PENDING"),
		hasApprovedCurrentStage: currentApprovalStatus === "APPROVED",
		hasRejectedCurrentStage: currentApprovalStatus === "REJECTED",

		isExternalApprover: currentUserApproval?.isExternalApprover === true,
		wasExternalApprover: userApprovals.some(
			({ approval }) => approval.isExternalApprover === true,
		),
	};
};
