// handouts/handoutApprovalWorkflow.mapper.ts
//
// Handouts has no WorkflowTemplate/WorkflowInstance behind it (see
// handoutsDecision.services.ts: "no WorkflowInstance behind Handouts"), so
// there is no WorkflowStage[] to run through EPC's own
// workflows/utils/approvalWorkflow.mapper.ts. GET /handouts/approval-workflow
// already resolves the two fixed, environment-configured roles to real
// users on the backend (handouts.services.ts's getHandoutApprovalWorkflow);
// this file's only job is reshaping that real response into the
// ApprovalTableRow[] shape the shared ApprovalTable component expects —
// the same role EPC's mapper plays, scaled down to two fixed stages instead
// of a template's dynamic ones.
//
// Two call sites, two different needs:
//   - NewHandoutPage's review step previews the flow before anything has
//     happened — no handoutStatus is passed, so every stage's status stays
//     null (and the caller hides the whole "status" column, same as EPC's
//     own review step hides it for a draft).
//   - HandoutDetailPage views a real request that already has a status —
//     handoutStatus IS passed, and each stage's status comes from the
//     table below, the same way EPC derives a real stage's status from its
//     WorkflowInstance rather than leaving it blank.

import type { ApprovalTableRow } from "../../workflows/types/types";
import type { HandoutApprovalWorkflow, HandoutStatus } from "./handouts.types";

// Reuses EPC's own status tokens ("APPROVED" / "REJECTED" / "CLARIFIED" /
// "IN_PROGRESS") so the shared ApprovalTable's Badge renders with the same
// colors/meaning it already uses for EPC — not a Handouts-specific palette.
type HandoutStageStatusToken =
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFIED";

type StageStatusPair = {
  approval: HandoutStageStatusToken | null;
  delivery: HandoutStageStatusToken | null;
};

// One row per HandoutStatus, both stages' outcomes side by side — the
// whole state machine in one place instead of two parallel switches.
const STAGE_STATUS_BY_HANDOUT_STATUS: Record<HandoutStatus, StageStatusPair> = {
  PENDING_APPROVAL: { approval: "IN_PROGRESS", delivery: null },
  CLARIFICATION_REQUESTED: { approval: "CLARIFIED", delivery: null },
  REJECTED: { approval: "REJECTED", delivery: null },
  // Requester withdrew it before the approver acted — closest available
  // tone to "did not go through".
  CANCELLED: { approval: "REJECTED", delivery: null },
  // Approver said yes; delivery is now in progress.
  APPROVED: { approval: "APPROVED", delivery: "IN_PROGRESS" },
  // A delivery-stage outcome, not a reversal of the approval.
  CANNOT_FULFIL: { approval: "APPROVED", delivery: "REJECTED" },
  CLOSED: { approval: "APPROVED", delivery: "APPROVED" },
};

export type MapHandoutApprovalWorkflowOptions = {
  /** Omit for a preview with no status yet (NewHandoutPage's review step). */
  handoutStatus?: HandoutStatus;
};

export const mapHandoutApprovalWorkflowToRows = (
  workflow: HandoutApprovalWorkflow | undefined,
  options: MapHandoutApprovalWorkflowOptions = {},
): ApprovalTableRow[] => {
  if (!workflow) return [];

  const stageStatus = options.handoutStatus
    ? STAGE_STATUS_BY_HANDOUT_STATUS[options.handoutStatus]
    : null;

  return workflow.stages.map((stage) => {
    const status = stageStatus
      ? stage.stageOrder === 1
        ? stageStatus.approval
        : stageStatus.delivery
      : null;

    // Each stage has exactly one responsible person, reused for both the
    // row's own display fields and its single approver entry.
    const person = {
      name: stage.name,
      email: stage.email,
      designation: stage.designation,
    };

    return {
      id: `handout-stage-${stage.stageOrder}`,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      // Not a template-derived ANY/ALL/SOME rule — one person per stage —
      // so the label stays fixed rather than computed.
      strategy: "Single approver",
      minApprovals: 1,
      totalApprovers: 1,
      status,
      ...person,
      approvers: [
        {
          id: `handout-approver-${stage.stageOrder}`,
          ...person,
          minApprovals: 1,
          status,
        },
      ],
    };
  });
};
