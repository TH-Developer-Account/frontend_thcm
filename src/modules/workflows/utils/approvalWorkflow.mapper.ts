import type {
	ApprovalRule,
	ApprovalStageLike,
	ApprovalTableApproverRow,
	ApprovalTableRow,
	MapWorkflowStagesOptions,
	WorkflowApprovalLike,
	WorkflowStage,
	WorkflowUser,
} from "../types/types";
import { normalizeWorkflowStatus } from "./status";
import { deriveStrategy, getStrategyLabel } from "./strategy";
import { getFullName } from "./user";

const getStageName = (stage: ApprovalStageLike): string =>
	stage.stageName ?? stage.name ?? `Stage ${stage.stageOrder}`;

const getTotalApprovers = (stage: ApprovalStageLike): number =>
	stage.approvals?.length || stage.approvers?.length || 0;

const isApprovalRule = (value: string): value is ApprovalRule =>
	value === "ANY" || value === "ALL" || value === "SOME";

const getEffectiveStrategy = (
	stage: ApprovalStageLike,
	totalApprovers: number,
): ApprovalRule => {
	const minApprovals = Number(stage.minApprovals);

	if (Number.isFinite(minApprovals) && minApprovals > 0) {
		return deriveStrategy(minApprovals, totalApprovers);
	}

	const strategy = normalizeWorkflowStatus(stage.strategy);
	return isApprovalRule(strategy)
		? strategy
		: deriveStrategy(1, totalApprovers);
};

const getStageMinApprovals = (stage: ApprovalStageLike): string | number => {
	if (
		stage.minApprovals !== undefined &&
		stage.minApprovals !== null &&
		stage.minApprovals !== ""
	) {
		return stage.minApprovals;
	}

	const totalApprovers = getTotalApprovers(stage);
	return getEffectiveStrategy(stage, totalApprovers) === "ALL"
		? totalApprovers
		: totalApprovers > 0
			? 1
			: 0;
};

export const getApprovalStrategyLabel = (stage: ApprovalStageLike): string => {
	const totalApprovers = getTotalApprovers(stage);
	return getStrategyLabel(
		getEffectiveStrategy(stage, totalApprovers),
		totalApprovers,
	);
};

const mapActiveApproval = (
	approval: WorkflowApprovalLike,
	stageOrder: number,
	index: number,
	minApprovals: string | number,
): ApprovalTableApproverRow => {
	const user = approval.approver ?? approval.user;

	return {
		id: approval.id ?? `${stageOrder}-${index}`,
		name: getFullName(user, "--"),
		email: user?.email?.trim() || "--",
		designation: user?.designation || "--",
		isExternal: Boolean(approval.isExternalApprover),
		minApprovals,
		status: normalizeWorkflowStatus(approval.status) || null,
	};
};

const mapPreviewApprover = (
	approver: WorkflowApprovalLike,
	stageOrder: number,
	index: number,
	minApprovals: string | number,
): ApprovalTableApproverRow => {
	const user = approver.user ?? approver.approver;

	return {
		id: approver.id ?? `${stageOrder}-${index}`,
		name: getFullName(user, "--"),
		email: user?.email?.trim() || "--",
		designation: user?.designation || "--",
		isExternal: Boolean(approver.isExternalApprover),
		minApprovals,
		status: approver.status ? normalizeWorkflowStatus(approver.status) : null,
	};
};

const shouldRenderStageStatus = (stage: ApprovalStageLike): boolean => {
	const status = normalizeWorkflowStatus(stage.status);

	return (
		status === "APPROVED" ||
		status === "REJECTED" ||
		status === "CLARIFIED" ||
		(stage.isCurrentIteration === true && status === "IN_PROGRESS")
	);
};

const isStageCompleted = (
	stage: ApprovalStageLike,
	approvers: ApprovalTableApproverRow[],
	minApprovals: string | number,
): boolean => {
	const required = Number(minApprovals);
	if (!Number.isFinite(required) || required <= 0) return false;

	const stageStatus = normalizeWorkflowStatus(stage.status);
	const approvedCount = approvers.filter(
		(approver) => normalizeWorkflowStatus(approver.status) === "APPROVED",
	).length;

	return (
		stage.isCurrentIteration === true &&
		stageStatus === "APPROVED" &&
		approvedCount >= required
	);
};

export const mapWorkflowStagesToApprovalRows = (
	stages: readonly ApprovalStageLike[] = [],
	options: MapWorkflowStagesOptions = {},
): ApprovalTableRow[] => {
	const showOnlyCurrentStageStatus = options.showOnlyCurrentStageStatus ?? true;

	return stages.map((stage) => {
		const minApprovals = getStageMinApprovals(stage);
		const shouldShowStageStatus = showOnlyCurrentStageStatus
			? shouldRenderStageStatus(stage)
			: true;

		const approvers = stage.approvals?.length
			? stage.approvals.map((approval, index) =>
					mapActiveApproval(approval, stage.stageOrder, index, minApprovals),
				)
			: (stage.approvers ?? []).map((approver, index) =>
					mapPreviewApprover(approver, stage.stageOrder, index, minApprovals),
				);

		const stageCompleted = isStageCompleted(stage, approvers, minApprovals);

		return {
			id: stage.id ?? String(stage.stageOrder),
			stageOrder: stage.stageOrder,
			stageName: getStageName(stage),
			strategy: getApprovalStrategyLabel(stage),
			minApprovals,
			totalApprovers: approvers.length,
			status: shouldShowStageStatus ? (stage.status ?? null) : null,
			name: approvers[0]?.name ?? "--",
			email: approvers[0]?.email ?? "--",
			designation: approvers[0].designation ?? "--",
			approvers: approvers.map((approver) => {
				if (!shouldShowStageStatus) return { ...approver, status: null };

				// Stage is fully satisfied: leftover pending approvers show "--"
				if (
					stageCompleted &&
					normalizeWorkflowStatus(approver.status) === "PENDING"
				) {
					return { ...approver, status: null };
				}

				return approver;
			}),
		};
	});
};

export const mapEpcWorkflowUser = (approval: any): WorkflowUser => {
	const user = approval?.approver ?? approval?.user;

	return {
		id:
			user?.id ??
			approval?.approverId ??
			approval?.userId ??
			approval?.id ??
			"",
		firstName: user?.firstName?.trim() ?? user?.first_name?.trim() ?? "",
		lastName: user?.lastName?.trim() ?? user?.last_name?.trim() ?? "",
		email: user?.email?.trim() || undefined,
		designation: user?.designation ?? "",
	};
};

export const mapEpcWorkflowApproval = (
	approval: any,
): WorkflowApprovalLike => ({
	id: approval?.id,
	approverId: approval?.approverId ?? approval?.userId,
	status: approval?.status,
	isExternalApprover: approval?.isExternalApprover ?? false,
	approver: mapEpcWorkflowUser(approval),
});

export const mapEpcWorkflowStage = (
	stage: WorkflowStage,
): ApprovalStageLike => {
	const approvals = stage.approvals ?? [];
	const approvers = stage.approvers ?? [];

	return {
		id: stage.id,
		workflowId: stage.workflowId,
		stageOrder: stage.stageOrder,
		stageName: stage.stageName,
		name: stage.name,
		strategy: stage.strategy,
		minApprovals: stage.minApprovals,
		status: stage.status,
		isCurrentIteration: stage.isCurrentIteration,

		approvals: approvals.map(mapEpcWorkflowApproval),
		approvers: approvers.map(mapEpcWorkflowApproval),
	};
};
