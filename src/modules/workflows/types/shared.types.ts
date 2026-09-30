/**
 * Cross-cutting workflow types.
 *
 * Rule of thumb: a type lives HERE only if it is a primitive that other types
 * are built from, or it is imported by more than one layer (api / utils /
 * hooks / components). Everything else lives in types.ts. Component-local
 * prop types stay in their own component file.
 */

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export type ApiDateString = string;

export type ApprovalRule = "ANY" | "ALL" | "SOME";

export type WorkflowExecutionMode = "SEQUENTIAL" | "PARALLEL";

/**
 * Who a workflow is being created for. Sent TO the API.
 * APP  = admin / application template
 * USER = personal template
 */
export type WorkflowCreationScope = "APP" | "USER";

/**
 * Who owns a saved template. Returned BY the API.
 * ADMIN = app-level template that can be assigned to other users
 * USER  = personal template owned by its creator
 */
export type WorkflowOwnerType = "ADMIN" | "USER";

/**
 * Listing tabs / `scope` query param. This was previously declared three
 * times (WorkflowScope, WorkflowListScope in types.ts, WorkflowListScope in
 * workflow.context.ts).
 */
export type WorkflowListScope = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";

/**
 * Stage statuses. The first four were the original union; the rest are the
 * values approvalWorkflow.helpers / approvalWorkflow.mapper already branch
 * on at runtime (CLARIFY, CLARIFIED, SKIPPED, CANCELLED, COMPLETED), so the
 * type now matches what the code actually handles.
 */
export type WorkflowStageStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "APPROVED"
	| "REJECTED"
	| "CLARIFY"
	| "CLARIFIED"
	| "SKIPPED"
	| "CANCELLED"
	| "COMPLETED";

export type WorkflowApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

export type WorkflowUser = {
	id: string;
	firstName: string;
	lastName: string;
	name?: string;
	email?: string;
	phone?: string;
	avatarUrl?: string;
	designation?: string | null;
};

/* -------------------------------------------------------------------------- */
/* WorkflowApprovalLike / ApprovalStageLike                                    */
/*                                                                             */
/* Canonical shapes for "an approval row" and "a stage that has some".        */
/* Declared once here; types.ts re-exports them and                            */
/* approvalWorkflow.helpers.ts re-exports them for backwards compatibility.    */
/*                                                                             */
/* Generic over TApproval so approver-data extraction utilities can narrow to  */
/* a richer approval shape when needed.                                        */
/* -------------------------------------------------------------------------- */

export type WorkflowApprovalLike = {
	id?: string | null;
	approverId?: string | null;
	userId?: string | null;
	status?: string | null;
	isExternalApprover?: boolean | null;
	approver?: WorkflowUser | null;
	user?: WorkflowUser | null;
};

export type ApprovalStageLike<
	TApproval extends WorkflowApprovalLike = WorkflowApprovalLike,
> = {
	id?: string | null;
	workflowId?: string | null;
	stageOrder: number;
	stageName?: string | null;
	name?: string | null;
	strategy?: ApprovalRule | "QUORUM" | string | null;
	minApprovals?: number | string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;
	approvals?: readonly TApproval[] | null;
	// Preview-mode approvers (before a real Approval row exists) share the
	// same shape as WorkflowApprovalLike.
	approvers?: readonly WorkflowApprovalLike[] | null;
	/**
	 * @deprecated Nothing in the workflow module reads this. Was typed with
	 * the `Boolean` wrapper type; now a primitive boolean. Remove once a
	 * repo-wide search confirms no other module sets it.
	 */
	isExternal?: boolean;
};
