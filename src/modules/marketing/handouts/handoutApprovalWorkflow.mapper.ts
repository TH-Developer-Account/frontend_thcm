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
//     handoutStatus IS passed, and each stage's status is derived from it,
//     the same way EPC derives a real stage's status from its
//     WorkflowInstance rather than leaving it blank.

import type { ApprovalTableRow } from "../../workflows/types/types";
import type { HandoutApprovalWorkflow, HandoutStatus } from "./handouts.types";

// Reuses EPC's own status tokens ("APPROVED" / "REJECTED" / "CLARIFIED" /
// "IN_PROGRESS") so the shared ApprovalTable's Badge renders with the same
// colors/meaning it already uses for EPC — not a Handouts-specific palette.
type HandoutStageStatusToken =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFIED";

const deriveApprovalStageStatus = (
  handoutStatus: HandoutStatus,
): HandoutStageStatusToken | null => {
  switch (handoutStatus) {
    case "PENDING_APPROVAL":
      return "IN_PROGRESS"; // waiting on the approver right now
    case "APPROVED":
    case "CLOSED":
    case "CANNOT_FULFIL":
      // All three mean the approver already said yes — CANNOT_FULFIL is a
      // delivery-stage outcome, not a reversal of the approval.
      return "APPROVED";
    case "REJECTED":
      return "REJECTED";
    case "CLARIFICATION_REQUESTED":
      return "CLARIFIED";
    case "CANCELLED":
      // The requester withdrew it before the approver acted — closest
      // available tone to "did not go through".
      return "REJECTED";
    default:
      return null;
  }
};

const deriveDeliveryStageStatus = (
  handoutStatus: HandoutStatus,
): HandoutStageStatusToken | null => {
  switch (handoutStatus) {
    case "APPROVED":
      return "IN_PROGRESS"; // waiting on the delivery team right now
    case "CLOSED":
      return "APPROVED"; // hand-delivered, request closed
    case "CANNOT_FULFIL":
      return "REJECTED";
    default:
      // PENDING_APPROVAL, REJECTED, CLARIFICATION_REQUESTED, CANCELLED —
      // the delivery stage was never reached.
      return null;
  }
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

  return workflow.stages.map((stage) => {
    const status = options.handoutStatus
      ? stage.stageOrder === 1
        ? deriveApprovalStageStatus(options.handoutStatus)
        : deriveDeliveryStageStatus(options.handoutStatus)
      : null;

    return {
      id: `handout-stage-${stage.stageOrder}`,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      // Each stage has exactly one responsible person — not a
      // template-derived ANY/ALL/SOME rule, so the label stays fixed
      // rather than being computed the way EPC's getApprovalStrategyLabel
      // is.
      strategy: "Single approver",
      minApprovals: 1,
      totalApprovers: 1,
      name: stage.name,
      email: stage.email,
      designation: stage.designation,
      status,
      approvers: [
        {
          id: `handout-approver-${stage.stageOrder}`,
          name: stage.name,
          email: stage.email,
          designation: stage.designation,
          minApprovals: 1,
          status,
        },
      ],
    };
  });
};
