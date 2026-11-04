// forms/Review/EpcReviewSubmit.tsx
// Final "Review & Submit" card, used by the Add CRF/EPF wizard (last step)
// and by the activity detail page (Review & Submit tab).
//
//   ┌ Review & Submit ───────────────────────────────────────────┐
//   │ EPC Details        (EpcForm, view mode)                    │
//   │ CRF                (read-only line items, or "no CRF")     │
//   │ EPF                (read-only summary)                     │
//   │ Approval Workflow  (preview — loads when this card mounts) │
//   ├────────────────────────────────────────────────────────────┤
//   │ [footerStart…]                            [Final Submit]   │
//   └────────────────────────────────────────────────────────────┘
//
// "Final Submit" ALWAYS calls workflowApi.finalizeEpc first — that endpoint
// decides server-side (Schedule of Authority eligibility check) whether the
// EPC can be auto-approved without any workflow at all. Only when it isn't
// (`data.bypassed === false`) does this component fall back to its previous
// assignWorkflow flow, which stays gated on a successful preview exactly as
// before.
//
// Eligibility is checked against EPF.tataHitachiPoAmount — the Tata Hitachi
// share only, dealer share excluded — because SOA authority is scoped to
// what Tata Hitachi itself is on the hook for. The workflow-template preview
// below uses the same amount, so what the user previews (when there is a
// preview at all) matches what would be assigned.
//
// No workflow for this amount (empty preview, or the preview call answers
// 404 / 400 = no matching template) AND not SOA-eligible:
//   • Final Submit stays disabled (and the handler refuses even if invoked)
//   • the Approval Workflow block simply says
//     "There is no workflow assigned for this amount." (no request button)
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  FileText,
  ReceiptIndianRupee,
  RefreshCcw,
  Send,
  ShieldCheck,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import FormHeader from "../../../../../components/ui/FormHeader";
import { useToast } from "../../../../../context/Auth/AuthContext";
import {
  ApprovalTable,
  getWorkflowErrorMessage,
  workflowApi,
} from "../../../../workflows";

import CrfSection from "../../../crf/core/CrfSection";
import EpcForm from "../EPC/EpcForm";
import EpfSection from "./EpfSection";
import { epcKeys } from "../../queries/epc.queries";
import type { EpcDetailResponse } from "../../types/epc.types";
import { mapWorkflowStagesToApprovalRows } from "../../utils/formatters";
import { isEpcSubmitted } from "../EPC/epc.utils";

/* ========================================================================== */
/*                                   Config                                   */
/* ========================================================================== */

const SUBJECT_TYPE = "EVENT_PROPOSAL" as const;

export const NO_WORKFLOW_MESSAGE =
  "There is no workflow assigned for this amount.";

export const workflowPreviewKey = (epcId: string, tataHitachiAmount: number) =>
  ["workflow-preview", SUBJECT_TYPE, epcId, tataHitachiAmount] as const;

export const epcAuthorityEligibilityKey = (epcId: string) =>
  ["epc-authority-eligibility", epcId] as const;

// Review cards are read-only; these satisfy CrfSection / EpfSection props.
const noop = () => {};
const asyncNoop = async () => {};

export type EpcReviewSubmitProps = {
  epcData: EpcDetailResponse;
  workspaceId?: string | null;
  appId?: string | null;
  /** Called after the EPC was submitted — either auto-approved under the
   *  Schedule of Authority, or sent into a workflow (parent refreshes /
   *  navigates either way). */
  onSubmitted: () => void | Promise<void>;
  /**
   * @deprecated There is no "Request workflow" button any more. Kept optional
   * so existing callers still type-check; it is never called.
   */
  onRequestWorkflow?: () => void | Promise<void>;
  /** Rendered at the left of the footer (e.g. the wizard's Back button). */
  footerStart?: ReactNode;
};

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

const toAmount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The preview endpoint answers 404 (no templates) or 400 (no template matches
 * the amount) when nothing is assigned to this amount — an expected "no
 * workflow" outcome, not a failure to retry.
 */
const isNoWorkflowError = (error: unknown) => {
  const err = error as {
    response?: { status?: number };
    status?: number;
  } | null;
  const status = err?.response?.status ?? err?.status;

  return status === 404 || status === 400;
};

const ReviewBlock = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: typeof FileText;
  children: ReactNode;
}) => (
  <section className="min-w-0 border-b border-dashed border-[var(--color-border)] pb-4 last:border-b-0">
    <FormHeader title={title} Icon={Icon} />
    <div className="min-w-0 px-3">{children}</div>
  </section>
);

/* ========================================================================== */
/*                                 Component                                  */
/* ========================================================================== */

export default function EpcReviewSubmit({
  epcData,
  workspaceId,
  appId,
  onSubmitted,
  footerStart,
}: EpcReviewSubmitProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const epcId = epcData.id;
  const tataHitachiAmount = toAmount(epcData.epf?.tataHitachiPoAmount);
  const alreadySubmitted = isEpcSubmitted(epcData);

  /** Why the workflow can't be previewed / submitted yet (null = all good). */
  const blocker = !epcData.epf
    ? "Save the EPF before submitting."
    : !workspaceId
      ? "Workspace not found."
      : !appId
        ? "Application ID not found."
        : tataHitachiAmount <= 0
          ? "Tata Hitachi share must be greater than zero."
          : null;

  /* --------------- Schedule of Authority eligibility check --------------- */
  // Read-only — never commits anything. Drives whether the workflow preview
  // below runs at all: while the creator is already an eligible Approver
  // for this amount, there is no point previewing a workflow that will
  // never be created.
  const eligibilityQuery = useQuery({
    queryKey: epcAuthorityEligibilityKey(epcId),
    queryFn: () => workflowApi.getEpcAuthorityEligibility(epcId),
    enabled: !blocker && !alreadySubmitted,
    refetchOnMount: "always",
    staleTime: 60 * 1000,
  });

  const isBypassEligible = eligibilityQuery.data?.eligible ?? false;

  /* ----------------------- Preview: loads on landing ---------------------- */
  // Skipped entirely while SOA-eligible — fails open to the preview if the
  // eligibility check itself errored, so a creator who isn't eligible never
  // gets stuck with neither a preview nor a path to submit.

  const previewQuery = useQuery({
    queryKey: workflowPreviewKey(epcId, tataHitachiAmount),
    queryFn: async () => {
      const response = await workflowApi.previewWorkflow({
        subjectType: SUBJECT_TYPE,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget: tataHitachiAmount },
      });

      return (
        mapWorkflowStagesToApprovalRows(response?.stages ?? [], {
          showOnlyCurrentStageStatus: false,
        }) ?? []
      );
    },
    enabled:
      !blocker &&
      !alreadySubmitted &&
      (eligibilityQuery.isError ||
        (eligibilityQuery.isSuccess && !isBypassEligible)),
    // Always re-check on landing: workflow templates / approver
    // assignments can change while the user is filling the EPF.
    refetchOnMount: "always",
    staleTime: 60 * 1000,
    // No point retrying when the amount simply has no workflow.
    retry: (failureCount, error) =>
      !isNoWorkflowError(error) && failureCount < 1,
  });

  const previewRows = previewQuery.data ?? [];

  /** A workflow was found and can be shown. */
  const hasWorkflow = previewQuery.isSuccess && previewRows.length > 0;

  /* ------------------------- Final Submit ------------------------------ */

  // The ONLY place that commits anything. Always tries the Schedule of
  // Authority auto-approve path first (server-side decision — see
  // epc.controller.ts's finalizeEventProposal); only on
  // `data.bypassed === false` does handleFinalSubmit fall back to
  // assignWorkflow below.
  const finalizeMutation = useMutation({
    mutationFn: () => workflowApi.finalizeEpc(epcId),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      workflowApi.assignWorkflow({
        subjectType: SUBJECT_TYPE,
        subjectId: epcId,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget: tataHitachiAmount },
      }),
  });

  const handleFinalSubmit = async () => {
    if (finalizeMutation.isPending || submitMutation.isPending) return;

    if (blocker) {
      showToast({
        type: "error",
        title: "Cannot submit",
        description: blocker,
      });
      return;
    }

    try {
      const finalizeResult = await finalizeMutation.mutateAsync();

      if (finalizeResult.data.bypassed) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: epcKeys.detail(epcId) }),
          queryClient.invalidateQueries({ queryKey: epcKeys.lists() }),
        ]);

        showToast({
          type: "success",
          title: "Approved",
          description:
            "EPC auto-approved under the Schedule of Authority. No workflow was required.",
        });

        await onSubmitted();
        return;
      }

      // Not SOA-eligible — fall back to the normal workflow-assignment
      // path. Never submit without a previewed workflow, even if this
      // handler is invoked some other way than the (disabled) button.
      if (!hasWorkflow) {
        showToast({
          type: "error",
          title: "Cannot submit",
          description: NO_WORKFLOW_MESSAGE,
        });
        return;
      }

      await submitMutation.mutateAsync();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: epcKeys.detail(epcId) }),
        queryClient.invalidateQueries({ queryKey: epcKeys.lists() }),
      ]);

      showToast({
        type: "success",
        title: "Submitted",
        description: "The approval workflow has started.",
      });

      await onSubmitted();
    } catch (error) {
      console.error("EPC submission failed:", error);

      showToast({
        type: "error",
        title: "Workflow Error",
        description: getWorkflowErrorMessage(
          error,
          "Unable to submit the EPC.",
        ),
      });
    }
  };

  const canSubmit =
    !alreadySubmitted &&
    !blocker &&
    !eligibilityQuery.isLoading &&
    (isBypassEligible || hasWorkflow) &&
    !finalizeMutation.isPending &&
    !submitMutation.isPending;

  /* ------------------------------- Render -------------------------------- */

  const noWorkflowMessage = (
    <p className="text-sm text-[var(--color-text-muted)]" role="status">
      {NO_WORKFLOW_MESSAGE}
    </p>
  );

  const renderPreview = () => {
    if (alreadySubmitted) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]">
          The approval workflow has already started. See the Approval Workflow
          tab for its progress.
        </p>
      );
    }

    if (blocker) {
      return <p className="text-sm text-[var(--color-danger)]">{blocker}</p>;
    }

    if (eligibilityQuery.isLoading) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]" role="status">
          Checking approval authority...
        </p>
      );
    }

    if (isBypassEligible) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]" role="status">
          You are authorized to approve this EPC directly under the Schedule of
          Authority
          {eligibilityQuery.data?.authorityLimitLabel
            ? ` (${eligibilityQuery.data.authorityLimitLabel} band)`
            : ""}
          . No approval workflow is required — click Final Submit to approve.
        </p>
      );
    }

    if (previewQuery.isLoading) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]" role="status">
          Loading approval workflow...
        </p>
      );
    }

    if (previewQuery.isError && isNoWorkflowError(previewQuery.error)) {
      return noWorkflowMessage;
    }

    if (previewQuery.isError) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--color-danger)]">
            {getWorkflowErrorMessage(
              previewQuery.error,
              "Unable to preview the approval workflow.",
            )}
          </p>
          <Button
            type="button"
            text="Retry"
            Icon={RefreshCcw}
            size="sm"
            appearance="standard"
            variant="outline"
            onClick={() => void previewQuery.refetch()}
          />
        </div>
      );
    }

    if (previewRows.length === 0) {
      return noWorkflowMessage;
    }

    return (
      <div className="approval-workflow-content max-w-full overflow-x-auto">
        <ApprovalTable data={previewRows} />
      </div>
    );
  };

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">{footerStart}</div>

      <Button
        type="button"
        text={
          finalizeMutation.isPending || submitMutation.isPending
            ? "Submitting..."
            : "Final Submit"
        }
        Icon={Send}
        size="sm"
        appearance="standard"
        variant="brand"
        disabled={!canSubmit}
        onClick={() => void handleFinalSubmit()}
      />
    </div>
  );

  return (
    <Card
      title="Review & Submit"
      subtitle="Check the details below. Final Submit starts the approval workflow."
      footer={footer}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ReviewBlock title="EPC Details" Icon={CalendarCheck}>
          <EpcForm mode="view" initialData={epcData} />
        </ReviewBlock>

        <ReviewBlock title="CRF" Icon={FileText}>
          <CrfSection
            epcData={epcData}
            isEditing={false}
            onCancel={noop}
            onSuccess={asyncNoop}
          />
        </ReviewBlock>

        <ReviewBlock title="EPF" Icon={ReceiptIndianRupee}>
          <EpfSection
            epcData={epcData}
            isEditing={false}
            onCancel={noop}
            onSuccess={asyncNoop}
          />
        </ReviewBlock>

        <ReviewBlock title="Approval Workflow" Icon={ShieldCheck}>
          {renderPreview()}
        </ReviewBlock>
      </div>
    </Card>
  );
}
