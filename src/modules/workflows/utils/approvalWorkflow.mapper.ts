import type {
	ApprovalRule,
	ApprovalStageLike,
	ApprovalTableApproverRow,
	ApprovalTableRow,
	MapWorkflowStagesOptions,
	WorkflowApprovalLike,
	WorkflowPreviewApproverLike,
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
		minApprovals,
		status: normalizeWorkflowStatus(approval.status) || null,
	};
};

const mapPreviewApprover = (
	approver: WorkflowPreviewApproverLike,
	stageOrder: number,
	index: number,
	minApprovals: string | number,
): ApprovalTableApproverRow => {
	const user = approver.user ?? approver.approver;

	return {
		id: approver.id ?? `${stageOrder}-${index}`,
		name: getFullName(user, "--"),
		email: user?.email?.trim() || "--",
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
			approvers: approvers.map((approver) => ({
				...approver,
				status: shouldShowStageStatus ? approver.status : null,
			})),
		};
	});
};
