import type {
	ActiveWorkflowApprovalLike,
	ApprovalStageLike,
	ApprovalTableApproverRow,
	ApprovalTableRow,
	MapWorkflowStagesOptions,
	PreviewWorkflowApproverLike,
	WorkflowPersonLike,
} from "./approvalWorkflow.types";

const normalize = (value: unknown): string =>
	String(value ?? "")
		.trim()
		.toUpperCase();

const getPersonName = (person?: WorkflowPersonLike | null): string => {
	if (!person) {
		return "--";
	}

	if (person.name?.trim()) {
		return person.name.trim();
	}

	const firstName = person.first_name ?? person.firstName ?? "";
	const lastName = person.last_name ?? person.lastName ?? "";

	return `${firstName} ${lastName}`.trim() || "--";
};

const getStageName = (stage: ApprovalStageLike): string => {
	return stage.stageName ?? stage.name ?? `Stage ${stage.stageOrder}`;
};

const getTotalApprovers = (stage: ApprovalStageLike): number => {
	if (stage.approvals?.length) {
		return stage.approvals.length;
	}

	return stage.approvers?.length ?? 0;
};

const getStageMinApprovals = (stage: ApprovalStageLike): string | number => {
	const totalApprovers = getTotalApprovers(stage);
	const strategy = normalize(stage.strategy);

	if (
		stage.minApprovals !== undefined &&
		stage.minApprovals !== null &&
		stage.minApprovals !== ""
	) {
		return stage.minApprovals;
	}

	if (strategy === "ALL") {
		return totalApprovers;
	}

	if (strategy === "ANY" || strategy === "SOME") {
		return totalApprovers > 0 ? 1 : 0;
	}

	return totalApprovers > 0 ? 1 : 0;
};

export const getApprovalStrategyLabel = (stage: ApprovalStageLike): string => {
	const totalApprovers = getTotalApprovers(stage);
	const minApprovals = Number(stage.minApprovals ?? 0);
	const strategy = normalize(stage.strategy);

	if (totalApprovers <= 1) {
		return "Sequential";
	}

	if (
		strategy === "ALL" ||
		(totalApprovers > 0 && minApprovals === totalApprovers)
	) {
		return "ALL";
	}

	if (strategy === "ANY" || strategy === "SOME" || minApprovals === 1) {
		return "Parallel";
	}

	return "Parallel";
};

const mapActiveApproval = (
	approval: ActiveWorkflowApprovalLike,
	stageOrder: number,
	index: number,
	minApprovals: string | number,
): ApprovalTableApproverRow => {
	const person = approval.approver ?? approval.user;

	return {
		id: approval.id ?? `${stageOrder}-${index}`,
		name: getPersonName(person),
		email: person?.email || "--",
		minApprovals,
		status: normalize(approval.status) || null,
	};
};

const mapPreviewApprover = (
	approver: PreviewWorkflowApproverLike,
	stageOrder: number,
	index: number,
	minApprovals: string | number,
): ApprovalTableApproverRow => {
	const person = approver.user ?? approver.approver;

	return {
		id: approver.id ?? `${stageOrder}-${index}`,
		name: getPersonName(person),
		email: person?.email || "--",
		minApprovals,
		status: approver.status ? normalize(approver.status) : null,
	};
};

const shouldRenderStageStatus = (stage: ApprovalStageLike): boolean => {
	const status = normalize(stage.status);

	return (
		status === "APPROVED" ||
		status === "REJECTED" ||
		status === "CLARIFIED" ||
		(stage.isCurrentIteration === true && status === "IN_PROGRESS")
	);
};

export const mapWorkflowStagesToApprovalRows = (
	stages: ApprovalStageLike[] = [],
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
