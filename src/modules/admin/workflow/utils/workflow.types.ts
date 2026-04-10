export type WorkflowStatus =
	| "Draft"
	| "Active"
	| "Paused"
	| "Archived"
	| "Pending Approval";

export type WorkflowOwnerType = "mine" | "team";

export type WorkflowItem = {
	id: string;
	name: string;
	module: string;
	owner: string;
	ownerType: WorkflowOwnerType;
	stages: number;
	lastUpdated: string;
	status: WorkflowStatus;
};

export type WorkflowFilterKey = "all" | "mine" | "draft" | "active" | "pending";
