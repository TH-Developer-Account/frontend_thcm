import React from "react";
import { type ReactNode } from "react";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";

import {
  ArrowLeft,
  CheckCircle2,
  MessageSquareWarning,
  RefreshCcw,
  Save,
  XCircle,
} from "lucide-react";

import Button from "../../../components/common/Button";
import type {
  VendorCreationFormOneValues,
  VendorCreationFormTwoValues,
  VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";
import { ReasonActionModal } from "../../marketing/activity-planner/components/common/ReasonActionModal";

import {
  getCurrentApprovalStage,
  getIsUserInCurrentStage,
} from "../../marketing/activity-planner/helpers/approvalWorkflow.helpers";
import { workflowApi } from "../../marketing/activity-planner/api/workflow.api";
import ApprovalWorkflowTableContent from "../../../components/ui/workflow/ApprovalWorkflowTableContent";
import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import type { ApprovalStageLike } from "../../../components/ui/workflow/approvalWorkflow.types";

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
  mode?: VendorCreationSummaryMode;

  formOneValues: VendorCreationFormOneValues;
  formTwoValues: VendorCreationFormTwoValues;
  formOneDocuments?: VendorOnboardingDocument[];

  onBack?: () => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onClarify?: () => void;
  onAcceptAndClose?: () => void;
  onFetchWorkflow?: () => void | Promise<void>;

  canSubmit?: boolean;
  canApprove?: boolean;
  canClarify?: boolean;
  canAcceptAndClose?: boolean;

  workflowStages?: readonly ApprovalStageLike[];
  commentsSection?: ReactNode;
  workflowLoading?: boolean;
};

type ReasonModalState = {
  mode: "clarify-workflow" | null;
  loading: boolean;
};

const VendorCreationSummaryForm = ({
  mode = "edit",
  formOneValues,
  formTwoValues,
  formOneDocuments = EMPTY_DOCUMENTS,
  onBack,
  onSubmit,
  onApprove,
  onClarify,
  onAcceptAndClose,
  onFetchWorkflow,
  canSubmit = false,
  canApprove = false,
  canClarify = false,
  canAcceptAndClose = false,
  workflowStages = [],
  commentsSection,
  workflowLoading = false,
}: VendorCreationSummaryFormProps) => {
  const isViewMode = mode === "view";
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reasonModal, setReasonModal] = React.useState<ReasonModalState>({
    mode: null,
    loading: false,
  });

  const openReasonModal = React.useCallback(
    (mode: ReasonModalState["mode"]) => {
      setReasonModal({
        mode,
        loading: false,
      });
    },
    [],
  );

  const closeReasonModal = React.useCallback(() => {
    setReasonModal({
      mode: null,
      loading: false,
    });
  }, []);
  const userId = user?.id as string | undefined;

  const showSubmitAction =
    !isViewMode && canSubmit && typeof onSubmit === "function";

  const showApproveAction = canApprove && typeof onApprove === "function";
  const showClarifyAction = canClarify && typeof onClarify === "function";

  const showAcceptAndCloseAction =
    canAcceptAndClose && typeof onAcceptAndClose === "function";

  const currentStage = React.useMemo(
    () => getCurrentApprovalStage(workflowStages),
    [workflowStages],
  );

  const hasWorkflow = workflowStages.length > 0;

  const showWorkflowBlock =
    hasWorkflow || typeof onFetchWorkflow === "function";

  const hasApprovalActions =
    showApproveAction || showClarifyAction || showAcceptAndCloseAction;

  const isUserInCurrentStage = React.useMemo(
    () => getIsUserInCurrentStage(workflowStages, userId),
    [workflowStages, userId],
  );

  const canActOnCurrentStage = Boolean(currentStage && isUserInCurrentStage);

  console.log({ canActOnCurrentStage });

  const handleApprove = React.useCallback(async () => {
    if (!currentStage?.id) return;

    try {
      const { message } = await workflowApi.approveStage(currentStage.id);

      showToast({
        type: "success",
        title: "Success",
        description: message,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Error while approving",
      });
    }
  }, [currentStage, showToast]);

  const handleReasonConfirm = React.useCallback(
    async (reason: string) => {
      try {
        setReasonModal((prev) => ({
          ...prev,
          loading: true,
        }));

        if (!currentStage?.id) {
          showToast({
            type: "error",
            title: "Not allowed",
            description: "No active approval stage found.",
          });
          return;
        }

        const { message } = await workflowApi.clarifyStage(
          currentStage?.id ?? "",
          reason,
        );

        showToast({
          type: "success",
          title: "Success",
          description: message,
        });

        closeReasonModal();
      } catch (err) {
        showToast({
          type: "error",
          title: "Error",
          description:
            err instanceof Error
              ? err.message
              : "Unable to complete this action.",
        });
      } finally {
        setReasonModal((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    },
    [currentStage?.id, showToast, closeReasonModal],
  );

  return (
    <div className="vendor-summary-form">
      <VendorCreationFormOne
        mode="view"
        canEdit={false}
        values={formOneValues}
        errors={{}}
        initialDocuments={formOneDocuments}
        requireDocuments={false}
        requireDpdpConsent={false}
      />

      <VendorCreationFormTwo
        mode="view"
        canEdit={false}
        values={formTwoValues}
        errors={{}}
      />

      {commentsSection ? (
        <section className="vendor-summary-block">
          <h3 className="vendor-summary-block-title">Comments</h3>

          <div className="vendor-summary-block-body">{commentsSection}</div>
        </section>
      ) : null}

      {showWorkflowBlock ? (
        <section className="vendor-summary-block">
          <div className="vendor-summary-block-header">
            {!hasWorkflow && typeof onFetchWorkflow === "function" ? (
              <Button
                type="button"
                text={
                  workflowLoading ? "Fetching workflow..." : "Fetch workflow"
                }
                Icon={RefreshCcw}
                size="sm"
                appearance="standard"
                variant="outline"
                disabled={workflowLoading}
                onClick={() => {
                  void onFetchWorkflow();
                }}
              />
            ) : null}
          </div>

          {hasWorkflow ? (
            <div className="vendor-summary-block-body">
              <ApprovalWorkflowTableContent
                stages={workflowStages}
                showEmptyState={!onFetchWorkflow}
              />
            </div>
          ) : (
            <div className="vendor-summary-block-body">
              <div className="approval-workflow-empty">
                <p className="approval-workflow-empty-title">
                  No approval workflow assigned
                </p>

                <p className="approval-workflow-empty-description">
                  Fetch the applicable workflow to generate the approval stages.
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {hasApprovalActions ? (
        <section className="vendor-approval-panel">
          <div className="vendor-approval-copy">
            <h3 className="vendor-approval-title">Approval action</h3>

            <p className="vendor-approval-description">
              Review the request and perform the available workflow action.
            </p>
          </div>
        </section>
      ) : null}

      <div className="vendor-onboarding-form-actions">
        {onBack ? (
          <div className="vendor-approval-actions">
            <Button
              type="button"
              text="Back"
              size="sm"
              Icon={ArrowLeft}
              iconPosition="left"
              appearance="standard"
              variant="outline"
              onClick={onBack}
            />
            {canActOnCurrentStage && (
              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 overflow-visible border-t border-gray-200 bg-white px-4 py-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    text="Send for Clarification"
                    variant="outline"
                    appearance="standard"
                    disabled={!canActOnCurrentStage}
                    onClick={() => openReasonModal("clarify-workflow")}
                  />
                  <Button
                    type="button"
                    text="Approve"
                    variant="brand"
                    appearance="standard"
                    disabled={!canActOnCurrentStage}
                    onClick={handleApprove}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="vendor-onboarding-form-actions-end">
          {showSubmitAction ? (
            <Button
              type="button"
              text="Submit"
              size="sm"
              appearance="standard"
              variant="brand"
              Icon={Save}
              onClick={onSubmit}
            />
          ) : null}
        </div>
      </div>
      <ReasonActionModal
        open={Boolean(reasonModal.mode)}
        mode={reasonModal.mode}
        loading={reasonModal.loading}
        onClose={closeReasonModal}
        onConfirm={handleReasonConfirm}
      />
    </div>
  );
};

export default VendorCreationSummaryForm;
