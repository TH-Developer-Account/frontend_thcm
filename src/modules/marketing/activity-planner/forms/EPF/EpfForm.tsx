// forms/EPF/EpfForm.tsx
// EPF form: ONE Card made of collapsible `sections` —
//   Event Cost Overheads · Budget Summary · Participants · Dealer Info · Budget
//   · Approval Workflow (only when `submitWithWorkflow`)
// with the actions in the card footer.
//
//   footer:  [footerStart…] [Draft saved 10:42]   [gate message] [Cancel] [Reset] [Submit]
//
// With `submitWithWorkflow`, the "Approval Workflow" section below is now a
// strict, manually-triggered gate (useEpfForm.ts's authorityCheck /
// workflowPreview) rather than something that ran automatically as you
// typed:
//   1. "Check Authority" — against the live Tata Hitachi share. Must be
//      re-run any time that amount changes (results are pinned to the
//      amount they were checked against).
//   2. "Preview Workflow" — only shown once Check Authority says a workflow
//      is actually needed (authorized to propose, not auto-approved).
//   3. Submit stays disabled until both have passed for the CURRENT amount
//      (see `authorityBlocksSubmit`). The server-side decision at submit
//      time (finalizeEpc) remains authoritative regardless — this gate
//      exists so the EPF is never saved as SUBMITTED for an amount the
//      creator isn't authorized for in the first place.
//
// The budget info is fetched separately and can be slow / fail on its own, so
// the Card is NEVER put in a full "Loading content…" state: every section
// renders immediately and only the Budget Summary shows its own loading /
// retry state.
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Receipt,
  RefreshCcw,
  Save,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card, { type CardSection } from "../../../../../components/common/Card";
import { ApprovalTable } from "../../../../workflows";

import BudgetShare from "../../components/activityFormView/BudgetShare";
import { calculateBudgetShares } from "./epf.calculations";
import EpfItemsSection from "./EpfItemSection";
import { useEpfForm, type EpfFormProps } from "./useEpfForm";
import { useEpfFormSections } from "./EpfFormFields";

export type EpfFormCardProps = EpfFormProps & {
  /** Card title. Defaults to "Create / Edit Event Proposition Form". */
  title?: ReactNode;
  /** Overrides the primary button label. */
  submitLabel?: string;
  /** Rendered at the left of the footer (e.g. the wizard's Back button). */
  footerStart?: ReactNode;
};

/** Saving validates as a full submission. */
const SAVE_STATUS = "SUBMITTED";

export default function EpfForm(props: EpfFormCardProps) {
  const { onCancel, submitLabel, footerStart, title, submitWithWorkflow } =
    props;

  const {
    values,
    errors,
    handleChange,
    handleReset,
    options,
    costItems,
    setCostItems,
    handleSubmit,
    eventCost,
    epcId,
    isEditMode,
    draftSavedAt,
    authorityCheck,
    workflowPreview,
    authorityBlocksSubmit,
    loading,
    budgetLoading,
    budgetError,
    refetchBudget,
    submitting,
  } = useEpfForm(props);

  const cardTitle =
    title ??
    (isEditMode
      ? "Edit Event Proposition Form"
      : "Create Event Proposition Form");

  // An attachment is still uploading: its S3 key isn't known yet, so saving
  // now would drop the file from the line item.
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const fieldSections = useEpfFormSections({
    values,
    errors,
    handleChange,
    eventCost,
  });

  const primaryLabel = submitting
    ? submitWithWorkflow
      ? "Submitting..."
      : "Saving..."
    : attachmentBusy
      ? "Uploading file..."
      : (submitLabel ?? (isEditMode ? "Update EPF" : "Save"));

  // Live numbers for the summary — they move as the user edits the table
  // or the dealer percentage.
  const shares = calculateBudgetShares(values, eventCost);

  /** One short line summarizing where the gate currently stands, shown in
   *  the footer next to Submit. Null once nothing's blocking it. */
  const gateMessage: string | null = !submitWithWorkflow
    ? null
    : !authorityCheck.checked
      ? 'Click "Check Authority" below before submitting.'
      : !authorityCheck.proposerEligible
        ? "Not authorized to submit this amount."
        : authorityCheck.needsWorkflow && !workflowPreview.hasWorkflow
          ? 'Click "Preview Workflow" below before submitting.'
          : null;

  const renderAuthoritySection = () => {
    if (eventCost <= 0) {
      return (
        <p className="text-sm text-[var(--color-text-muted)]">
          Add event cost items to check your Schedule of Authority eligibility.
        </p>
      );
    }

    // Amount changed since the last check (or it was never run) — the
    // previous result, if any, no longer applies to this amount.
    if (!authorityCheck.checked) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-text-muted)]" role="status">
            {authorityCheck.checking
              ? "Checking your authority for this amount..."
              : "Check whether you're authorized to submit this amount before continuing."}
          </p>
          <Button
            type="button"
            text={authorityCheck.checking ? "Checking..." : "Check Authority"}
            onClick={() => void authorityCheck.run()}
            Icon={ShieldCheck}
            size="sm"
            appearance="standard"
            variant="outline"
            disabled={authorityCheck.checking}
          />
        </div>
      );
    }

    if (!authorityCheck.proposerEligible) {
      return (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {authorityCheck.authorityLimitLabel
            ? `You are not authorized to submit an amount in the "${authorityCheck.authorityLimitLabel}" band. This exceeds your assigned limit.`
            : "You are not authorized to submit an Event Proposal for this amount."}
        </p>
      );
    }

    if (!authorityCheck.needsWorkflow) {
      return (
        <p className="text-sm text-[var(--color-success)]" role="status">
          You're authorized to approve this amount directly — no workflow is
          required.
        </p>
      );
    }

    // Authorized to propose, not auto-approved → a workflow preview is
    // required before Submit unlocks.
    if (!workflowPreview.checked) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-text-muted)]" role="status">
            {workflowPreview.loading
              ? "Loading approval workflow..."
              : "You're authorized to submit this amount, but it needs an approval workflow. Preview it before submitting."}
          </p>
          <Button
            type="button"
            text={workflowPreview.loading ? "Loading..." : "Preview Workflow"}
            onClick={() => void workflowPreview.run()}
            Icon={ShieldCheck}
            size="sm"
            appearance="standard"
            variant="outline"
            disabled={workflowPreview.loading}
          />
        </div>
      );
    }

    if (workflowPreview.error || !workflowPreview.hasWorkflow) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            No approval workflow template currently matches this amount. Ask
            your administrator to set one up, then check again.
          </p>
          <Button
            type="button"
            text="Check again"
            onClick={() => void workflowPreview.run()}
            Icon={RefreshCcw}
            size="sm"
            appearance="standard"
            variant="outline"
            disabled={workflowPreview.loading}
          />
        </div>
      );
    }

    return (
      <div className="approval-workflow-content max-w-full overflow-x-auto">
        <ApprovalTable data={workflowPreview.rows} />
      </div>
    );
  };

  const sections: CardSection[] = [
    {
      id: "overheads",
      title: "Event Cost Overheads",
      Icon: Receipt,
      className: "epf-section--full",
      actions: (
        <span className="line-item-editor-count">
          {costItems.length} {costItems.length === 1 ? "item" : "items"}
        </span>
      ),
      children: (
        <EpfItemsSection
          items={costItems}
          onChange={setCostItems}
          options={options}
          isViewer={false}
          epcId={epcId}
          onAttachmentBusyChange={setAttachmentBusy}
        />
      ),
    },
    {
      id: "summary",
      title: "Budget Summary",
      Icon: Wallet,
      className: "epf-section--full",
      children: (
        <BudgetShare
          eventCost={eventCost}
          dealerName={values.dealerName}
          dealerPercent={shares.dealerPercent}
          dealerShare={shares.dealerShare}
          tataHitachiPercent={shares.tataHitachiPercent}
          tataHitachiShare={shares.tataHitachiShare}
          availableBudget={Number(values.availableBudget) || 0}
          loading={budgetLoading}
          error={budgetError}
          onRetry={refetchBudget}
        />
      ),
    },
    ...fieldSections,
    ...(submitWithWorkflow
      ? [
          {
            id: "workflow",
            title: "Approval Workflow",
            Icon: ShieldCheck,
            className: "epf-section--full",
            children: renderAuthoritySection(),
          } satisfies CardSection,
        ]
      : []),
  ];

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {footerStart}

        {!isEditMode && draftSavedAt && (
          <span
            className="text-xs text-[var(--color-text-muted)]"
            role="status"
          >
            Draft saved{" "}
            {new Date(draftSavedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {gateMessage && (
          <p className="text-sm text-[var(--color-text-muted)]" role="status">
            {gateMessage}
          </p>
        )}

        {onCancel && (
          <Button
            type="button"
            text="Cancel"
            onClick={onCancel}
            size="sm"
            Icon={X}
            appearance="standard"
            variant="outline"
            disabled={submitting}
          />
        )}

        <Button
          type="button"
          text="Reset"
          onClick={handleReset}
          Icon={RefreshCcw}
          size="sm"
          appearance="standard"
          variant="outline"
          disabled={submitting || loading}
        />

        <Button
          type="button"
          onClick={() => void handleSubmit(SAVE_STATUS)}
          text={primaryLabel}
          size="sm"
          appearance="standard"
          variant="brand"
          Icon={isEditMode && !submitWithWorkflow ? Save : ArrowRight}
          disabled={
            submitting || loading || attachmentBusy || authorityBlocksSubmit
          }
        />
      </div>
    </div>
  );

  return (
    <Card
      className="epf-sections-card"
      title={cardTitle}
      sections={sections}
      footer={footer}
    />
  );
}
