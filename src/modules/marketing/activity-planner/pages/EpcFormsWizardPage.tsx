// pages/EpcFormsWizardPage.tsx
// Stepper wizard opened from the EPC listing (EPC No / View / Edit / "Add CRF" / "Add EPF").
//
//   Step 1 — EPC Details : edit form
//   Step 2 — CRF         : create (optional, can be skipped) · edit (clarified) · or read-only
//   Step 3 — EPF & Submit: first submission → save EPF → Schedule of Authority
//                          finalize (auto-approve if eligible, else preview +
//                          assign a workflow for the Tata Hitachi share).
//                          Clarified edit    → save EPF → restart the same workflow
//                                              at stage 1 ("Resubmit").
//
// Entry point (?start=) decides the step the wizard opens on:
//   epc → EPC Details · crf → CRF · epf → EPF (CRF skipped)
// A saved-but-unsubmitted EPC ("Continue to submit") opens straight on the EPF
// step, pre-filled and editable, so the user can fix anything and submit.
//
// CLARIFIED EDIT is derived from the loaded EPC (see utils/epcClarification),
// never from router state, so a refresh or a pasted URL behaves the same as
// arriving from the listing.
import React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import Loader from "../../../../components/ui/Loader";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { StepProgress } from "../../../../components/ui/StepProgress";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

import EpfForm from "../forms/EPF/EpfForm";
import EpfSection from "../forms/EPF/EpfSection";
import { useActivityPermissions } from "../hooks/useActivityPlanner";
import { epcKeys, useEpcDetailQuery } from "../queries/epc.queries";
import { EPC_LISTING_PATH, type EpcWizardIntent } from "../utils/constant";
import { CrfForm } from "../../crf";
import CrfSection from "../../crf/core/CrfSection";
import { clearStoredEpcInfo } from "../utils/common";
import { isEpcSubmitted } from "../forms/EPC/epc.utils";
import { isEpcClarified } from "../utils/epcClarification";
import EpcForm from "../forms/EPC/EpcForm";

const STEP = { EPC: 1, CRF: 2, EPF: 3 } as const;
type WizardStep = (typeof STEP)[keyof typeof STEP];

const WIZARD_STEPS = [
  { id: STEP.EPC, label: "EPC Details" },
  { id: STEP.CRF, label: "CRF" },
  { id: STEP.EPF, label: "EPF & Submit" },
];

/** Which step each entry point opens the wizard on. */
const INTENT_START_STEP: Record<EpcWizardIntent, WizardStep> = {
  epc: STEP.EPC,
  crf: STEP.CRF,
  epf: STEP.EPF, // skips CRF
};

const noop = () => {};
const asyncNoop = async () => {};

/** Router state other screens can pass when opening the stepper. */
export type EpcWizardLocationState = { startAt?: "review"; mode?: "edit" };

const getIntent = (value: string | null): EpcWizardIntent =>
  value === "epf" ? "epf" : value === "epc" ? "epc" : "crf";

/** Shared footer layout: left group · right group. */
const StepFooter = ({
  start,
  end,
}: {
  start?: React.ReactNode;
  end?: React.ReactNode;
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">{start}</div>
    <div className="flex flex-wrap items-center justify-end gap-2">{end}</div>
  </div>
);

const EpcFormsWizardPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const intent = getIntent(searchParams.get("start"));
  // Old "open on Review" entry points now land on the EPF & Submit step.
  const startAtReview =
    (location.state as EpcWizardLocationState | null)?.startAt === "review";
  const [step, setStep] = React.useState<WizardStep>(
    startAtReview ? STEP.EPF : INTENT_START_STEP[intent],
  );

  const { data: epcData, isLoading, isError } = useEpcDetailQuery(id);
  const permissions = useActivityPermissions({ epcData: epcData ?? null });

  React.useEffect(() => {
    clearStoredEpcInfo();
  }, []);

  const hasCrf = Boolean(epcData?.crf);
  const hasEpf = Boolean(epcData?.epf);
  const workflowStarted = isEpcSubmitted(epcData);

  /** EPF saved earlier but never submitted (no workflow attached yet). */
  const needsFinalSubmit =
    hasEpf && !workflowStarted && Boolean(permissions.isProposer);

  /**
   * An approver sent the EPC back: the proposer edits EPC → CRF → EPF, and the
   * last step restarts the existing workflow at stage 1.
   */
  const isClarifiedEdit =
    workflowStarted &&
    Boolean(permissions.isProposer) &&
    isEpcClarified(epcData);

  // The workflow to restart. Same source useClarifiedResubmission uses on the
  // detail page.
  const activeWorkflowId = epcData?.activeWorkflow?.id ?? null;

  const isEligible =
    permissions.canCreateCrf ||
    permissions.canCreateEpf ||
    needsFinalSubmit ||
    isClarifiedEdit;

  const wasEligibleRef = React.useRef(false);
  if (isEligible) wasEligibleRef.current = true;
  const isBlocked = !isEligible && !wasEligibleRef.current;

  /* ------------------------------ Navigation ------------------------------ */

  const goToListing = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
    navigate(EPC_LISTING_PATH);
  }, [navigate, queryClient]);

  const goBack = React.useCallback(() => {
    setStep((current) => Math.max(STEP.EPC, current - 1) as WizardStep);
  }, []);

  const goNext = React.useCallback(() => {
    setStep((current) => Math.min(STEP.EPF, current + 1) as WizardStep);
  }, []);

  const handleCrfSaved = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: epcKeys.detail(id) });
    setStep(STEP.EPF);
  }, [id, queryClient]);

  /* -------------------------------- States -------------------------------- */

  if (isLoading) return <Loader />;

  const intentLabel = isClarifiedEdit
    ? "Update and resubmit"
    : intent === "epc"
      ? "Continue to submit"
      : `Add ${intent.toUpperCase()}`;

  const pageTitle = `${intentLabel}${
    epcData?.proposal_number ? ` · ${epcData.proposal_number}` : ""
  }`;

  const header = (
    <PageHeader
      headerText={pageTitle}
      navigation={{
        variant: "breadcrumbs",
        ariaLabel: "EPC wizard location",
        breadcrumbs: [
          { label: "Home Screen", href: "/" },
          { label: "EPC Listing", href: EPC_LISTING_PATH },
          { label: intentLabel },
        ],
        separator: "›",
      }}
    />
  );

  if (isError || !epcData || isBlocked) {
    return (
      <PageSectionLayout>
        {header}
        <Alert
          type="banner"
          variant="error"
          title={!epcData ? "EPC not found" : "Nothing to add"}
          description={
            !epcData
              ? "This EPC could not be loaded. It may have been removed."
              : "CRF and EPF have already been added for this EPC, or you don't have permission to add them."
          }
          primaryAction={{
            label: "Back to listing",
            onClick: () => navigate(EPC_LISTING_PATH),
          }}
        />
      </PageSectionLayout>
    );
  }

  /* ------------------------------ Shared buttons -------------------------- */

  const backButton = (
    <Button
      type="button"
      text="Back"
      Icon={ArrowLeft}
      size="sm"
      appearance="standard"
      variant="outline"
      onClick={goBack}
    />
  );

  const nextButton = (
    <Button
      type="button"
      text="Next"
      Icon={ArrowRight}
      iconPosition="right"
      size="sm"
      appearance="standard"
      variant="brand"
      onClick={goNext}
    />
  );

  const finishButton = (
    <Button
      type="button"
      text="Finish"
      Icon={Check}
      size="sm"
      appearance="standard"
      variant="brand"
      onClick={() => void goToListing()}
    />
  );

  /* ------------------------------ Step body ------------------------------- */

  const renderStep = () => {
    switch (step) {
      case STEP.EPC:
        // Edit mode: the EPC form only. The read-only view stays on view pages.
        return (
          <EpcForm
            key={epcData.id}
            mode="edit"
            epcId={epcData.id}
            initialData={epcData}
            onCancel={() => navigate(EPC_LISTING_PATH)}
            onSuccess={async () => {
              await queryClient.invalidateQueries({
                queryKey: epcKeys.detail(id),
              });
              goNext();
            }}
          />
        );

      case STEP.CRF:
        // Clarified edit: the existing CRF is editable (full replace of its
        // lines). "Skip CRF" keeps it exactly as it is. A CRF can't be added
        // at this point, so an EPC without one just moves on.
        if (isClarifiedEdit) {
          return hasCrf ? (
            <CrfForm
              epcId={epcData.id}
              initialData={epcData.crf}
              submitLabel="Save & Next"
              onSuccess={handleCrfSaved}
              onBackFromFirstStep={goBack}
              onSkip={goNext}
            />
          ) : (
            <Card footer={<StepFooter start={backButton} end={nextButton} />}>
              <p className="text-sm text-[var(--color-text-muted)]">
                No CRF was added to this EPC.
              </p>
            </Card>
          );
        }

        return hasCrf ? (
          <Card footer={<StepFooter start={backButton} end={nextButton} />}>
            <CrfSection
              epcData={epcData}
              isEditing={false}
              onCancel={noop}
              onSuccess={asyncNoop}
            />
          </Card>
        ) : (
          <CrfForm
            epcId={epcData.id}
            submitLabel="Save & Next"
            onSuccess={handleCrfSaved}
            // One Back (previous tab; on the first tab → EPC details) and a
            // quiet "Skip CRF" link replace the old two-button footerStart.
            onBackFromFirstStep={goBack}
            onSkip={goNext}
          />
        );

      case STEP.EPF:
        // Clarified edit → save EPF, then restart the SAME workflow at stage 1.
        // No workflow preview / assignment: the approval chain is unchanged.
        if (isClarifiedEdit && hasEpf) {
          return (
            <EpfForm
              key={epcData.epf?.id ?? "epf-resubmit"}
              mode="edit"
              epcId={epcData.id}
              epfId={epcData.epf?.id ?? null}
              initialData={epcData.epf}
              crfId={epcData.crf?.id ?? null}
              crfData={epcData.crf}
              budgetMasterId={epcData.budget_master_id}
              submitLabel="Resubmit"
              isClarifiedUpdate
              activeWorkflowId={activeWorkflowId}
              footerStart={backButton}
              onSuccess={goToListing}
            />
          );
        }

        // Already submitted → read-only, nothing left to do but leave.
        if (workflowStarted) {
          return (
            <Card footer={<StepFooter start={backButton} end={finishButton} />}>
              {hasEpf ? (
                <EpfSection
                  epcData={epcData}
                  isEditing={false}
                  onCancel={noop}
                  onSuccess={asyncNoop}
                />
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  This EPC has been submitted and its approval workflow is
                  running.
                </p>
              )}
            </Card>
          );
        }

        // New EPF, or a saved-but-unsubmitted one (edit + submit).
        // `key` remounts the form with fresh server data when the EPF changes.
        return (
          <EpfForm
            key={epcData.epf?.id ?? "new-epf"}
            mode={hasEpf ? "edit" : "create"}
            epcId={epcData.id}
            epfId={epcData.epf?.id ?? null}
            initialData={hasEpf ? epcData.epf : null}
            crfId={epcData.crf?.id ?? null}
            crfData={epcData.crf}
            budgetMasterId={epcData.budget_master_id}
            submitLabel="Submit"
            submitWithWorkflow
            footerStart={backButton}
            onSuccess={goToListing}
            onRequestWorkflow={goToListing}
          />
        );
    }
  };

  return (
    <PageSectionLayout>
      {header}

      {isClarifiedEdit ? (
        <Alert
          type="banner"
          variant="warning"
          title="Clarification requested"
          description="Update what's needed, then resubmit on the last step. Approval restarts from the first stage."
        />
      ) : null}

      <StepProgress
        steps={WIZARD_STEPS}
        currentStep={step}
        ariaLabel="Add forms progress"
        className="workflow-create-step-progress"
      />

      {renderStep()}
    </PageSectionLayout>
  );
};

export default EpcFormsWizardPage;
