export type ApprovalTableApproverRow = {
	id: string;
	name: string;
	email: string;
	minApprovals?: string | number | null;
	status?: string | null;
};

export type ApprovalTableRow = {
	id: string;
	stageOrder: number;
	stageName: string;
	strategy: string;
	minApprovals?: string | number | null;
	totalApprovers?: string | number | null;
	status?: string | null;

	name?: string;
	email?: string;

	approvers?: ApprovalTableApproverRow[];
};

export type WorkflowPersonLike = {
	id?: string;
	first_name?: string | null;
	last_name?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	name?: string | null;
	email?: string | null;
};

export type ActiveWorkflowApprovalLike = {
	id?: string;
	status?: string | null;
	approver?: WorkflowPersonLike | null;
	user?: WorkflowPersonLike | null;
};

export type PreviewWorkflowApproverLike = {
	id?: string;
	status?: string | null;
	user?: WorkflowPersonLike | null;
	approver?: WorkflowPersonLike | null;
};

export type ApprovalStageLike = {
	id?: string;
	workflowId?: string;

	stageOrder: number;
	stageName?: string | null;
	name?: string | null;

	strategy?: string | null;
	minApprovals?: number | string | null;

	status?: string | null;
	isCurrentIteration?: boolean | null;

	approvals?: ActiveWorkflowApprovalLike[];
	approvers?: PreviewWorkflowApproverLike[];
};

export type MapWorkflowStagesOptions = {
	showOnlyCurrentStageStatus?: boolean;
};
