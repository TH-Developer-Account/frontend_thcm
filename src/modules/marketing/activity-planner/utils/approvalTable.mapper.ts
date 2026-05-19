import type { ApprovalTableRow } from "../../../../utils/types";

type ActiveWorkflowApproval = {
	id?: string;
	status?: string | null;
	approver?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	};
};

type PreviewWorkflowApprover = {
	id?: string;
	user?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	};
};

type ApprovalStageLike = {
	id?: string;
	stageOrder: number;
	stageName?: string | null;
	name?: string | null;
	strategy?: string | null;
	minApprovals?: number | string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;

	// active workflow shape
	approvals?: ActiveWorkflowApproval[];

	// preview workflow shape
	approvers?: PreviewWorkflowApprover[];
};

const normalize = (value: unknown) => String(value ?? "").toUpperCase();

const isCurrentStage = (stage: ApprovalStageLike) => {
	return (
		stage.isCurrentIteration === true &&
		normalize(stage.status) === "IN_PROGRESS"
	);
};

const getStageName = (stage: ApprovalStageLike) => {
	return stage.stageName ?? stage.name ?? `Stage ${stage.stageOrder}`;
};

const getStageMinApprovals = (stage: ApprovalStageLike) => {
	const totalApprovers =
		stage.approvals?.length ?? stage.approvers?.length ?? 0;

	const strategy = normalize(stage.strategy);

	if (stage.minApprovals) return stage.minApprovals;

	if (strategy === "ALL") return totalApprovers;
	if (strategy === "ANY") return totalApprovers > 0 ? 1 : 0;
	if (strategy === "SOME") return totalApprovers > 0 ? 1 : 0;

	return totalApprovers > 0 ? 1 : 0;
};

export const getApprovalStrategyLabel = (stage: ApprovalStageLike) => {
	const totalApprovers =
		stage.approvals?.length ?? stage.approvers?.length ?? 0;

	const minApprovals = Number(stage.minApprovals || 0);
	const strategy = normalize(stage.strategy);

	if (totalApprovers <= 1) return "Sequential";

	if (strategy === "ALL" || minApprovals === totalApprovers) {
		return "ALL";
	}

	if (strategy === "ANY" || minApprovals === 1) {
		return "Parallel";
	}

	return "Parallel";
};

const getActiveWorkflowApprovers = (
	stage: ApprovalStageLike,
	minApprovals: string | number | null,
	shouldShowStatus: boolean,
) => {
	return (stage.approvals ?? []).map((approval, index) => ({
		id: approval.id ?? `${stage.stageOrder}-${index}`,
		name:
			[approval.approver?.first_name, approval.approver?.last_name]
				.filter(Boolean)
				.join(" ") || "--",
		email: approval.approver?.email || "--",
		minApprovals,
		status: shouldShowStatus ? (approval.status ?? "--") : null,
	}));
};

const getPreviewWorkflowApprovers = (
	stage: ApprovalStageLike,
	minApprovals: string | number | null,
) => {
	return (stage.approvers ?? []).map((approver, index) => ({
		id: approver.id ?? `${stage.stageOrder}-${index}`,
		name:
			[approver.user?.first_name, approver.user?.last_name]
				.filter(Boolean)
				.join(" ") || "--",
		email: approver.user?.email || "--",
		minApprovals,
		status: null,
	}));
};

export const mapWorkflowStagesToApprovalRows = (
	stages: ApprovalStageLike[] = [],
	options?: {
		showOnlyCurrentStageStatus?: boolean;
	},
): ApprovalTableRow[] => {
	const showOnlyCurrentStageStatus =
		options?.showOnlyCurrentStageStatus ?? true;

	return stages.map((stage) => {
		const minApprovals = getStageMinApprovals(stage);
		const shouldShowStatus = showOnlyCurrentStageStatus
			? isCurrentStage(stage)
			: true;

		const approvers = stage.approvals?.length
			? getActiveWorkflowApprovers(stage, minApprovals, shouldShowStatus)
			: getPreviewWorkflowApprovers(stage, minApprovals);

		return {
			id: stage.id ?? `${stage.stageOrder}`,
			stageOrder: stage.stageOrder,
			stageName: getStageName(stage),
			strategy: getApprovalStrategyLabel(stage),
			minApprovals,
			totalApprovers: approvers.length,
			status: shouldShowStatus ? (stage.status ?? null) : null,
			name: approvers[0]?.name ?? "--",
			email: approvers[0]?.email ?? "--",
			approvers,
		};
	});
};
