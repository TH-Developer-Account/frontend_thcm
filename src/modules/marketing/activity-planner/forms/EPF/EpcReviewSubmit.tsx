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
// "Final Submit" is the ONLY place that calls workflowApi.assignWorkflow.
// The budget sent is the EPF's saved event budget, so what the user previews
// is exactly what gets assigned.
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

/* ========================================================================== */
/*                                   Config                                   */
/* ========================================================================== */

const SUBJECT_TYPE = "EVENT_PROPOSAL" as const;

export const workflowPreviewKey = (epcId: string, budget: number) =>
  ["workflow-preview", SUBJECT_TYPE, epcId, budget] as const;

// Review cards are read-only; these satisfy CrfSection / EpfSection props.
const noop = () => {};
const asyncNoop = async () => {};

export type EpcReviewSubmitProps = {
  epcData: EpcDetailResponse;
  workspaceId?: string | null;
  appId?: string | null;
  /** Called after the workflow was assigned (parent refreshes / navigates). */
  onSubmitted: () => void | Promise<void>;
  /** Rendered at the left of the footer (e.g. the wizard's Back button). */
  footerStart?: ReactNode;
};

/* ========================================================================== */
/*                                  Helpers                                   */
/* ========================================================================== */

const toBudget = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const budget = toBudget(epcData.epf?.eventBudget);
  const alreadySubmitted = Boolean(epcData.activeWorkflow);

  /** Why the workflow can't be previewed / submitted yet (null = all good). */
  const blocker = !epcData.epf
    ? "Save the EPF before submitting."
    : !workspaceId
      ? "Workspace not found."
      : !appId
        ? "Application ID not found."
        : budget <= 0
          ? "Event budget must be greater than zero."
          : null;

  /* ----------------------- Preview: loads on landing ---------------------- */

  const previewQuery = useQuery({
    queryKey: workflowPreviewKey(epcId, budget),
    queryFn: async () => {
      const response = await workflowApi.previewWorkflow({
        subjectType: SUBJECT_TYPE,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget },
      });

      return (
        mapWorkflowStagesToApprovalRows(response?.stages ?? [], {
          showOnlyCurrentStageStatus: false,
        }) ?? []
      );
    },
    enabled: !blocker && !alreadySubmitted,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const previewRows = previewQuery.data ?? [];

  /* ------------------------- Final Submit ------------------------------ */

  const submitMutation = useMutation({
    mutationFn: () =>
      workflowApi.assignWorkflow({
        subjectType: SUBJECT_TYPE,
        subjectId: epcId,
        workspaceId: workspaceId as string,
        appId: appId as string,
        criteria: { budget },
      }),
  });

  const handleFinalSubmit = async () => {
    if (blocker) {
      showToast({
        type: "error",
        title: "Cannot submit",
        description: blocker,
      });
      return;
    }

    try {
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
      console.error("Workflow assignment failed:", error);

      showToast({
        type: "error",
        title: "Workflow Error",
        description: getWorkflowErrorMessage(
          error,
          "Unable to start the approval workflow.",
        ),
      });
    }
  };

  const canSubmit =
    !alreadySubmitted &&
    !blocker &&
    previewQuery.isSuccess &&
    previewRows.length > 0 &&
    !submitMutation.isPending;

  /* ------------------------------- Render -------------------------------- */

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

    if (previewQuery.isLoading) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]" role="status">
          Loading approval workflow...
        </p>
      );
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
      return (
        <p className="text-sm text-[var(--color-danger)]">
          No approval workflow is configured for this budget. Contact your
          administrator before submitting.
        </p>
      );
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
        text={submitMutation.isPending ? "Submitting..." : "Final Submit"}
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
