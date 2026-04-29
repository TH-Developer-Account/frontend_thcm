// EPC Detail / View API Response

import type { ApprovalApiStatus } from "../../../types";

export type ApiDateString = string;

export type EpcDetailResponse = {
	id: string;
	proposal_number: string;
	event_from_date: ApiDateString;
	event_to_date: ApiDateString;
	event_description: string;
	location: string;
	event_objective: string;
	status: ApprovalApiStatus;

	created_by_id: string;
	updated_by_id: string;

	department_id: string;
	region_id: string;
	branch_id: string;
	event_scale: number;
	budget_master_id: string;
	event_name_id: string;
	vertical_id: string;

	created_at: ApiDateString;
	updated_at: ApiDateString;

	department: EpcDepartment;
	vertical: EpcVertical;
	region: EpcRegion;
	branch: EpcBranch;
	event_name: EpcEventName;
	budget_master: EpcBudgetMaster;

	epf?: EpcDetailEpf | null;
	crf?: EpcDetailCrf | null;
	activeWorkflow?: EpcActiveWorkflow | null;
};

export type EpcDepartment = {
	id: string;
	department_name: string;
};

export type EpcVertical = {
	id: string;
	name: string;
	code: string;
};

export type EpcRegion = {
	id: string;
	region_name: string;
};

export type EpcBranch = {
	id: string;
	branch_name: string;
};

export type EpcEventName = {
	id: string;
	title: string;
};

export type EpcBudgetMaster = {
	id: string;
	value: string;
};

export type EpcDetailEpf = {
	id: string;
	externalParticipants: number;
	internalParticipants: number;
	eventBudget: string;
	annualBudget: string;
	availableBudget: string;
	dealerName: string;
	dealerPercent: number;
	dealerShare: number;
	tataHitachiPoAmount: number;
	status: ApprovalApiStatus;
	lineItems: EpcLineItem[];
};

export type EpcDetailCrf = {
	id: string;
	lineItems: EpcLineItem[];
};

export type EpcLineItem = {
	id: string;
	quantity: string;
	amount: string;
	product: {
		id: string;
		partNumber: string;
		name: string;
		description: string;
	};
};

export type EpcActiveWorkflow = {
	id: string;
	templateId: string;
	workspaceId: string;
	eventProposalId: string;
	iteration: number;
	isActive: boolean;
	workflowType: "STANDARD";
	status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
	currentStage: number;
	created_at: ApiDateString;
	updated_at: ApiDateString;
	template: EpcWorkflowTemplate;
	stages: EpcWorkflowStage[];
};

export type EpcWorkflowTemplate = {
	id: string;
	name: string;
	description: string;
};

export type EpcWorkflowStage = {
	id: string;
	workflowId: string;
	stageOrder: number;
	iteration: number;
	isCurrentIteration: boolean;
	strategy: "ALL" | "ANY" | "QUORUM";
	minApprovals: number | null;
	startedAt: ApiDateString | null;
	dueAt: ApiDateString | null;
	escalatedTo: string | null;
	status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
	approvals: EpcWorkflowApproval[];
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
