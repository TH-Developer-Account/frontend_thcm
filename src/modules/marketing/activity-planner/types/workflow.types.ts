import type { EpcWorkflowApproval, EpcWorkflowStage } from "./epc.types";

export type WorkflowStage = EpcWorkflowStage;
export type WorkflowApproval = EpcWorkflowApproval;

export type WorkflowStageStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "APPROVED"
	| "REJECTED";

export type WorkflowStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type WorkflowStrategy = "ALL" | "ANY" | "SOME" | "QUORUM";

export type WorkflowComment = {
	id?: string;
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	stageName?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	actor?: {
		id?: string;
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null;
	metadata?: {
		reason?: string | null;
	} | null;
};
