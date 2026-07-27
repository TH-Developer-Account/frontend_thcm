import type { ApiDateString } from "../../../modules/marketing/activity-planner/types/epc.types";

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
	avatarUrl?: string | null;
};

export type ActiveWorkflowApprovalLike = {
	id?: string;
	approverId?: string;
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
export type WorkflowStage = {
	id: string;
	workflowId: string;
	stageOrder: number;
	iteration: number;
	isCurrentIteration: boolean;
	strategy: "ALL" | "ANY" | "SOME" | "QUORUM";
	minApprovals: number | null;
	startedAt: ApiDateString | null;
	dueAt: ApiDateString | null;
	escalatedTo: string | null;
	status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
	approvals: EpcWorkflowApproval[];
	stageName?: string;
	name?: string;
};

export type ApprovalWorkflowStage = {
	id: string;
	workflowId: string;
	stageOrder: number;
	iteration: number;
	isCurrentIteration: boolean;
	strategy: "ALL" | "ANY" | "SOME" | "QUORUM";
	minApprovals: number | null;
	startedAt: ApiDateString | null;
	dueAt: ApiDateString | null;
	escalatedTo: string | null;
	status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
	approvals: EpcWorkflowApproval[];
	stageName?: string;
	name?: string;
};
export type EpcWorkflowApproval = {
	id: string;
	stageId: string;
	approverId: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	actedAt: ApiDateString | null;
	reason: string | null;
	approver: {
		id: string;
		first_name: string;
		last_name: string;
		email?: string;
	};
	comments: unknown[];
};
export type MapWorkflowStagesOptions = {
	showOnlyCurrentStageStatus?: boolean;
};

export type ApprovalLike = {
	id?: string;
	approverId?: string | null;
	status?: string | null;
	approver?: WorkflowPersonLike | null;
	user?: WorkflowPersonLike | null;
};
