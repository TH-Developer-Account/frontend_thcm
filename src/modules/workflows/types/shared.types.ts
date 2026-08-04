export type ApiDateString = string;

export type ApprovalRule = "ANY" | "ALL" | "SOME";

export type WorkflowExecutionMode = "SEQUENTIAL" | "PARALLEL";

export type WorkflowUser = {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowApprovalLike / ApprovalStageLike
//
// Canonical shapes for "an approval row" and "a stage that has some" —
// previously declared independently in both types.ts and
// approvalWorkflow.helpers.ts, which drifted apart (readonly vs mutable
// arrays, nullable vs not, missing fields on each side) until data crossing
// between the two threw assignability errors. One definition here, both
// files import it, so there's nothing left to drift.
//
// Generic over TApproval so approvalWorkflow.helpers.ts's approver-data
// extraction utilities can still narrow to a richer approval shape when
// needed, while everything else uses the default.
// ─────────────────────────────────────────────────────────────────────────────

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
  // same shape as WorkflowApprovalLike — reused rather than declaring a
  // third near-identical type.
  approvers?: readonly WorkflowApprovalLike[] | null;
};
