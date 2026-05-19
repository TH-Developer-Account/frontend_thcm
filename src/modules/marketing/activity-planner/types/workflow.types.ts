import type {
	ApiDateString,
	EpcWorkflowApproval,
	EpcWorkflowStage,
} from "./epc.types";

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
	id: string;
	message: string;
	entryType?: string;
	action?: string;
	reason?: string;
	stageName?: string;
	createdAt: ApiDateString;
	updatedAt?: ApiDateString;
	actor: {
		id: string;
		first_name: string;
		last_name: string;
	};
};
