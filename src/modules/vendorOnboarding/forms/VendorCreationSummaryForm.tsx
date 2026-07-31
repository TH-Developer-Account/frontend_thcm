import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowLeft,
  CircleCheck,
  Pencil,
  RefreshCcw,
  Save,
  Send,
} from "lucide-react";

import Button from "../../../components/common/Button";
import { ApprovalWorkflowTableContent } from "../../workflows/components/ApprovalWorkflowTableContent";
import WorkflowStagesForm from "../../workflows/components/WorkflowStagesForm";
import {
  addStageApprover,
  removeStageApprover,
  toggleStageExpanded,
  updateStageField,
} from "../../workflows/utils/workflow.helpers";

import { ReasonActionModal } from "../../../components/ui/ReasonActionModal";

import type {
  VendorCreationFormOneValues,
  VendorCreationFormTwoValues,
  VendorOnboardingDocument,
} from "../types/vendorOnboarding.types";

import VendorCreationFormOne from "./VendorCreationFormOne";
import VendorCreationFormTwo from "./VendorCreationFormTwo";
import {
  useOptionalVendorCreationFormContext,
  useVendorCreationSummaryController,
} from "../hooks/useVendorCreationForm";
import type {
  ApprovalStageLike,
  WorkflowStage,
  WorkflowApprover,
} from "../../workflows/types/types";

// ─────────────────────────────────────────────────────────────────────────────
// mapAssignedStagesToEditable
//
// Converts the read-only ApprovalStageLike[] (what the workflow detail
// endpoint returns — approvals with status, or approvers, depending on
// context) into the rich, editable WorkflowStage[] shape WorkflowStagesForm
// expects. Only the live iteration's stages are editable — a resubmission
// always operates on the current iteration, never historical ones.
// ─────────────────────────────────────────────────────────────────────────────

const mapAssignedStagesToEditable = (
  stages: ApprovalStageLike[],
): WorkflowStage[] =>
  stages
    .filter((stage) => stage.isCurrentIteration !== false)
    .map((stage, index) => {
      const approverSource = stage.approvals?.length
        ? stage.approvals
        : (stage.approvers ?? []);

      const approvers: WorkflowApprover[] = approverSource.flatMap((a) => {
        const user = a.user ?? a.approver;
        if (!user) return [];
        return [
          {
            id: a.id ?? user.id,
            stageId: stage.id ?? "",
            user,
            isExternalApprover: false,
          },
        ];
      });

      return {
        id: stage.id ?? `stage-${index}`,
        stageOrder: stage.stageOrder,
        name: stage.stageName ?? stage.name ?? `Stage ${stage.stageOrder}`,
        strategy: (stage.strategy as WorkflowStage["strategy"]) ?? "ANY",
        minApprovals: Number(stage.minApprovals) || 1,
        approvers,
        isExpanded: index === 0,
      };
    });

const createEditableStageId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type VendorCreationSummaryMode = "edit" | "view";

const EMPTY_DOCUMENTS: VendorOnboardingDocument[] = [];

type VendorCreationSummaryFormProps = {
  mode?: VendorCreationSummaryMode;

  formOneValues?: VendorCreationFormOneValues;
  formTwoValues?: VendorCreationFormTwoValues;
  formOneDocuments?: VendorOnboardingDocument[];

  onFormTwoChange?: <K extends keyof VendorCreationFormTwoValues>(
    key: K,
    value: VendorCreationFormTwoValues[K],
  ) => void;

  onBack?: () => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onClarify?: () => void;
  onAcceptAndClose?: () => void;
  onFetchWorkflow?: () => void | Promise<void>;
  onHandleSendBackVendor?: () => void | Promise<void>;

  canSendBackToVendor?: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canClarify?: boolean;
  canAcceptAndClose?: boolean;

  canEditVendorCode?: boolean;
  canSaveVendorCode?: boolean;
  vendorCodeLoading?: boolean;
  onSaveVendorCode?: () => void | Promise<boolean>;

  workflowStages?: ApprovalStageLike[];
  commentsSection?: ReactNode;
  workflowLoading?: boolean;

  // Stage editing on resubmit (proposer only, only during a pending
  // clarified iteration).
  canEditStagesOnResubmit?: boolean;
  stageEdits?: WorkflowStage[] | null;
  onStageEditsChange?: (stages: WorkflowStage[] | null) => void;
};

const VendorCreationSummaryForm = ({
  mode = "edit",
  formOneValues: formOneValuesProp,
  formTwoValues: formTwoValuesProp,
  formOneDocuments = EMPTY_DOCUMENTS,
  onFormTwoChange,
  onBack,
  onSubmit,
  onApprove,
  onClarify,
  onAcceptAndClose,
  onFetchWorkflow,
  onHandleSendBackVendor,
  canSendBackToVendor,
  canSubmit,
  canApprove,
  canClarify,
  canAcceptAndClose,
  canEditVendorCode,
  canSaveVendorCode,
  vendorCodeLoading,
  onSaveVendorCode,
  workflowStages = [],
  commentsSection,
  workflowLoading,
  canEditStagesOnResubmit,
  stageEdits,
  onStageEditsChange,
}: VendorCreationSummaryFormProps) => {
  const formContext = useOptionalVendorCreationFormContext();
  const formOneValues = formOneValuesProp ?? formContext?.formOneValues ?? {};
  const formTwoValues = formTwoValuesProp ?? formContext?.formTwoValues ?? {};
  const resolvedDocuments =
    formOneDocuments.length > 0
      ? formOneDocuments
      : (formContext?.formOneDocuments ?? EMPTY_DOCUMENTS);
  const resolvedWorkflowStages =
    workflowStages.length > 0
      ? workflowStages
      : (formContext?.workflowStages ?? []);
  const resolvedFormTwoChange =
    onFormTwoChange ?? formContext?.handleFormTwoChange;
  const resolvedOnBack = onBack ?? formContext?.handleBack;
  const resolvedOnSubmit = onSubmit ?? formContext?.handleSubmitSummary;
  const resolvedOnApprove = onApprove ?? formContext?.handleApprove;
  const resolvedOnClarify = onClarify ?? formContext?.handleClarify;
  const resolvedOnAcceptAndClose =
    onAcceptAndClose ?? formContext?.handleAcceptAndClose;
  const resolvedOnFetchWorkflow =
    onFetchWorkflow ?? formContext?.handleFetchWorkflow;
  const resolvedOnSaveVendorCode =
    onSaveVendorCode ?? formContext?.handleSaveVendorCode;
  const resolvedCanSubmit = canSubmit ?? formContext?.canSubmit ?? false;
  const resolvedCanApprove = canApprove ?? formContext?.canApprove ?? false;
  const resolvedCanClarify = canClarify ?? formContext?.canClarify ?? false;
  const resolvedCanAcceptAndClose =
    canAcceptAndClose ?? formContext?.canAcceptAndClose ?? false;
  const resolvedCanEditVendorCode =
    canEditVendorCode ?? formContext?.canEditVendorCode ?? false;
  const resolvedCanSaveVendorCode =
    canSaveVendorCode ?? formContext?.canSaveVendorCode ?? false;
  const resolvedVendorCodeLoading =
    vendorCodeLoading ?? formContext?.vendorCodeLoading ?? false;
  const resolvedWorkflowLoading =
    workflowLoading ?? formContext?.workflowLoading ?? false;

  const resolvedCanEditStagesOnResubmit =
    canEditStagesOnResubmit ?? formContext?.canEditStagesOnResubmit ?? false;
  const resolvedStageEdits = stageEdits ?? formContext?.stageEdits ?? null;
  const resolvedOnStageEditsChange =
    onStageEditsChange ?? formContext?.setStageEdits;

  const [isEditingStages, setIsEditingStages] = useState(false);
  const [draftStages, setDraftStages] = useState<WorkflowStage[]>([]);

  const beginEditingStages = () => {
    setDraftStages(
      resolvedStageEdits ?? mapAssignedStagesToEditable(resolvedWorkflowStages),
    );
    setIsEditingStages(true);
  };

  const cancelEditingStages = () => {
    setIsEditingStages(false);
    setDraftStages([]);
  };

  const confirmEditingStages = () => {
    resolvedOnStageEditsChange?.(draftStages);
    setIsEditingStages(false);
  };

  const handleAddStage = () => {
    setDraftStages((current) => [
      ...current.map((stage) => ({ ...stage, isExpanded: false })),
      {
        id: createEditableStageId(),
        stageOrder: current.length + 1,
        name: `Stage ${current.length + 1}`,
        strategy: "ANY",
        minApprovals: 1,
        approvers: [],
        isExpanded: true,
      },
    ]);
  };

  const isViewMode = mode === "view";
  const {
    reasonModal,
    canActOnCurrentStage,
    openReasonModal,
    closeReasonModal,
    handleApprove,
    handleReasonConfirm,
    handleVendorCodeSave,
  } = useVendorCreationSummaryController({
    workflowStages: resolvedWorkflowStages,
    onApprove: resolvedOnApprove,
    onClarify: resolvedOnClarify,
    onSaveVendorCode: resolvedOnSaveVendorCode,
  });

  const showSubmitAction =
    !isViewMode && resolvedCanSubmit && typeof resolvedOnSubmit === "function";

  const showApproveAction = resolvedCanApprove;

  const showClarifyAction =
    resolvedCanClarify && typeof resolvedOnClarify === "function";

  const showAcceptAndCloseAction =
    resolvedCanAcceptAndClose && typeof resolvedOnAcceptAndClose === "function";

  const showSendBackAction =
    canSendBackToVendor ?? formContext?.canSendBackToVendor ?? false;

  const hasWorkflow = resolvedWorkflowStages.length > 0;

  const showWorkflowBlock =
    hasWorkflow || typeof resolvedOnFetchWorkflow === "function";
  // const isThcmProposer =

  const hasApprovalActions =
    showApproveAction || showClarifyAction || showAcceptAndCloseAction;

  return (
    <div className="vendor-summary-form">
      <VendorCreationFormOne
        mode="view"
        canEdit={false}
        values={formOneValues}
        errors={{}}
        initialDocuments={resolvedDocuments}
        requireDocuments={false}
        requireDpdpConsent={false}
      />

      <VendorCreationFormTwo
        mode="view"
        canEdit={false}
        canEditVendorCode={resolvedCanEditVendorCode}
        values={formTwoValues}
        errors={{}}
        onChange={resolvedFormTwoChange}
        vendorCodeLoading={resolvedVendorCodeLoading}
      />

      {commentsSection ? (
        <div className="vendor-summary-block-body">{commentsSection}</div>
      ) : null}

      {showWorkflowBlock ? (
        <section className="vendor-summary-block">
          <div>
            {!hasWorkflow && typeof resolvedOnFetchWorkflow === "function" ? (
              <>
                <span>Click the button to start the workflow</span>

                <Button
                  type="button"
                  text={
                    resolvedWorkflowLoading
                      ? "Fetching workflow..."
                      : "Fetch workflow"
                  }
                  Icon={RefreshCcw}
                  size="sm"
                  appearance="standard"
                  variant="outline"
                  isTooltip="Click the button to start the workflow"
                  disabled={resolvedWorkflowLoading}
                  onClick={() => {
                    void resolvedOnFetchWorkflow();
                  }}
                />
              </>
            ) : null}
          </div>

          {hasWorkflow ? (
            <>
              {resolvedCanEditStagesOnResubmit && !isEditingStages ? (
                <div className="vendor-summary-block-body">
                  <Button
                    type="button"
                    text={
                      resolvedStageEdits
                        ? "Edit approval stages (edited)"
                        : "Edit approval stages"
                    }
                    Icon={Pencil}
                    size="sm"
                    appearance="standard"
                    variant="outline"
                    onClick={beginEditingStages}
                  />
                </div>
              ) : null}

              {isEditingStages ? (
                <>
                  <WorkflowStagesForm
                    stages={draftStages}
                    errors={[]}
                    formError={null}
                    currentUserId=""
                    onStageChange={(stageId, key, value) =>
                      setDraftStages((current) =>
                        updateStageField(current, stageId, key, value),
                      )
                    }
                    onToggleStage={(stageId) =>
                      setDraftStages((current) =>
                        toggleStageExpanded(current, stageId),
                      )
                    }
                    onRemoveApprover={(stageId, approverId) =>
                      setDraftStages((current) =>
                        removeStageApprover(current, stageId, approverId),
                      )
                    }
                    onAddApprover={(stageId, approver) =>
                      setDraftStages((current) =>
                        addStageApprover(current, stageId, approver),
                      )
                    }
                    onAddStage={handleAddStage}
                    onBack={cancelEditingStages}
                    onSubmit={confirmEditingStages}
                  />
                </>
              ) : (
                <ApprovalWorkflowTableContent
                  stages={resolvedWorkflowStages}
                  showEmptyState={!resolvedOnFetchWorkflow}
                />
              )}
            </>
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
        <div className="vendor-approval-actions">
          {resolvedOnBack ? (
            <Button
              type="button"
              text="Back"
              size="sm"
              Icon={ArrowLeft}
              iconPosition="left"
              appearance="standard"
              variant="outline"
              onClick={resolvedOnBack}
            />
          ) : null}
        </div>

        <div className="vendor-onboarding-form-actions-end">
          {resolvedCanEditVendorCode ? (
            <Button
              type="button"
              text={
                resolvedVendorCodeLoading ? "Updating..." : "Update Vendor Code"
              }
              Icon={Save}
              iconPosition="left"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={handleVendorCodeSave}
              disabled={
                !resolvedCanSaveVendorCode ||
                resolvedVendorCodeLoading ||
                typeof resolvedOnSaveVendorCode !== "function"
              }
            />
          ) : null}
          {canActOnCurrentStage ? (
            <>
              {showClarifyAction ? (
                <Button
                  type="button"
                  text="Send for Clarification"
                  size="sm"
                  appearance="standard"
                  variant="outline"
                  disabled={reasonModal.loading}
                  onClick={openReasonModal}
                />
              ) : null}

              {showApproveAction ? (
                <Button
                  type="button"
                  text="Approve"
                  size="sm"
                  appearance="standard"
                  variant="brand"
                  disabled={reasonModal.loading || resolvedVendorCodeLoading}
                  onClick={() => {
                    void handleApprove();
                  }}
                />
              ) : null}
            </>
          ) : null}
          {showAcceptAndCloseAction ? (
            <Button
              type="button"
              text="Accept and Close"
              size="sm"
              Icon={CircleCheck}
              appearance="standard"
              variant="brand"
              disabled={resolvedVendorCodeLoading}
              onClick={resolvedOnAcceptAndClose}
            />
          ) : null}
          {showSubmitAction ? (
            <Button
              type="button"
              text="Submit"
              size="sm"
              appearance="standard"
              variant="brand"
              Icon={Save}
              onClick={resolvedOnSubmit}
            />
          ) : null}
          {!canActOnCurrentStage && showSendBackAction ? (
            <Button
              type="button"
              text="Send Back to Vendor"
              size="sm"
              disabled={!showSendBackAction}
              appearance="standard"
              variant="outline"
              Icon={Send}
              onClick={onHandleSendBackVendor}
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
