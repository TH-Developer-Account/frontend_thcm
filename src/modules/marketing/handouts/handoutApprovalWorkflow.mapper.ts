// handouts/handoutApprovalWorkflow.mapper.ts
//
// The Approval stage is now real WorkflowTemplate data (see
// handouts.services.ts's getHandoutApprovalWorkflow) — it can have more
// than one approver, with a real ALL/ANY/SOME strategy — so this mapper no
// longer hardcodes "one person, one approver, strategy: Single approver"
// per stage. The Delivery stage stays a fixed single identity by design
// (not promoted into the workflow engine), which this mapper treats as the
// 1-approver edge case of the same general logic, rather than as a special
// case of its own.
//
// Reuses the shared strategy-labeling utilities EPC's own
// workflows/utils/approvalWorkflow.mapper.ts already built
// (deriveStrategy/getStrategyLabel in workflows/utils/strategy.ts) instead
// of inventing Handouts-specific wording — a 1-approver stage reads
// "Sequential" here exactly as it would for any EPC stage, so the shared
// ApprovalTable component stays the single place that vocabulary lives.
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
import {
  deriveStrategy,
  getStrategyLabel,
} from "../../workflows/utils/strategy";
import type {
  HandoutApprovalWorkflow,
  HandoutApprovalWorkflowApprover,
  HandoutStatus,
} from "./handouts.types";

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

const FALLBACK_APPROVER: HandoutApprovalWorkflowApprover = {
  name: "--",
  email: "--",
  designation: null,
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

    const totalApprovers = stage.approvers.length;
    // Delivery's strategy is null (fixed single identity, not
    // template-derived) — derive the same way a 1-approver template stage
    // would, so it reads identically rather than needing its own label.
    const strategy =
      stage.strategy ?? deriveStrategy(stage.minApprovals ?? 1, totalApprovers);
    const strategyLabel = getStrategyLabel(strategy, totalApprovers);

    const approvers = stage.approvers.map((approver, index) => ({
      id: `handout-stage-${stage.stageOrder}-approver-${index}`,
      name: approver.name,
      email: approver.email,
      designation: approver.designation,
      minApprovals: stage.minApprovals ?? 1,
      status,
    }));

    // Row-level singular fields are the collapsed-state / empty-approvers
    // fallback ApprovalTable renders with — not the primary display once
    // `approvers` is populated (see ApprovalTable.tsx: it prefers the
    // approvers list whenever it's non-empty).
    const primary = approvers[0] ?? {
      name: FALLBACK_APPROVER.name,
      email: FALLBACK_APPROVER.email,
      designation: FALLBACK_APPROVER.designation,
    };

    return {
      id: `handout-stage-${stage.stageOrder}`,
      stageOrder: stage.stageOrder,
      stageName: stage.stageName,
      strategy: strategyLabel,
      minApprovals: stage.minApprovals ?? totalApprovers,
      totalApprovers,
      status,
      name: primary.name,
      email: primary.email,
      designation: primary.designation,
      approvers,
    };
  });
};
