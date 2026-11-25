// handouts/NewHandoutPage.tsx
// "New handout request" as a stepper wizard (same pattern as the EPC / vendor
// forms: StepProgress + one Card per step with a Back / Next footer).
//
//   1  Handout Details  : purpose, required by, contact, deliver to,
//                         fulfillment (hand delivery / ship), remarks
//   2  CRF Items        : souvenir catalog + "Request list" sidebar
//   3  Review & Submit  : read-only summary + approval workflow, then submit
//
// Each Next validates its own step (useHandoutForm.validateDetails /
// validateItemsStep). Submit re-validates everything, refreshes stock and
// posts; if anything fails the wizard jumps back to the step with the error.
//
// Resubmit: the same page, opened as .../new?resubmitId=<id>. The clarified
// request's own details + items are loaded and prefilled, and Submit posts
// to /handouts/:id/resubmit instead of creating a new request — reusing the
// whole wizard rather than building a second edit flow.

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Send,
  Truck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import FormHeader from "../../../components/ui/FormHeader";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StepProgress } from "../../../components/ui/StepProgress";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { CRF_CATEGORIES, CrfCatalog, crfSearchPlaceholder } from "../crf";
import { ApprovalTable } from "../../workflows/components/ApprovalTable";

import { mapHandoutApprovalWorkflowToRows } from "./handoutApprovalWorkflow.mapper";
import {
  useHandoutApprovalWorkflowQuery,
  useHandoutQuery,
} from "./handouts.api";
import { HANDOUTS_BASE_PATH } from "./handouts.constants";
import HandoutDetailsFields from "./HandoutDetailsFields";
import type { HandoutDetail, HandoutItem } from "./handouts.types";
import HandoutItemsTable from "./HandoutItemsTable";
import HandoutRequestList from "./HandoutRequestList";
import { useHandoutForm } from "./useHandoutForm";
import { useHandoutPermissions } from "./useHandoutPermissions";
import "./handouts.css";

// Handouts are souvenirs only — no printed material or artwork tabs.
const SOUVENIR_ONLY = CRF_CATEGORIES.filter(
  (category) => category.value === "SOUVENIR",
);

const STEP = { DETAILS: 1, ITEMS: 2, REVIEW: 3 } as const;
type Step = (typeof STEP)[keyof typeof STEP];

const STEPS = [
  { id: STEP.DETAILS, label: "Handout Details" },
  { id: STEP.ITEMS, label: "CRF Items" },
  { id: STEP.REVIEW, label: "Review & Submit" },
];

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Footer layout: left group · right group (same as the EPC wizard). */
const StepFooter = ({ start, end }: { start?: ReactNode; end?: ReactNode }) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-2">{start}</div>
    <div className="flex flex-wrap items-center justify-end gap-2">{end}</div>
  </div>
);

export default function NewHandoutPage() {
  const [searchParams] = useSearchParams();
  const resubmitId = searchParams.get("resubmitId") ?? undefined;

  // Resubmit mode loads the existing (clarified) request first; the form
  // hook isn't created until we know what to prefill it with, or that
  // there's nothing to resubmit.
  const resubmitQuery = useHandoutQuery(resubmitId);

  return (
    <NewHandoutPageBody
      resubmitId={resubmitId}
      resubmitHandout={resubmitId ? resubmitQuery.data : undefined}
      resubmitLoading={Boolean(resubmitId) && resubmitQuery.isLoading}
      resubmitError={Boolean(resubmitId) && Boolean(resubmitQuery.error)}
    />
  );
}

function NewHandoutPageBody({
  resubmitId,
  resubmitHandout,
  resubmitLoading,
  resubmitError,
}: {
  resubmitId?: string;
  resubmitHandout?: HandoutDetail;
  resubmitLoading: boolean;
  resubmitError: boolean;
}) {
  const navigate = useNavigate();
  const { canRequest } = useHandoutPermissions();
  const [step, setStep] = useState<Step>(STEP.DETAILS);
  const [search, setSearch] = useState("");

  const isResubmitMode = Boolean(resubmitId);
  const form = useHandoutForm(
    isResubmitMode && resubmitHandout
      ? { resubmit: { id: resubmitId as string, initial: resubmitHandout } }
      : {},
  );

  const { values, errors, setField, setAddressField, itemErrors } = form;

  // The real approver / delivery person for the review step's Approval
  // Workflow table — fetched once up front rather than only when the
  // wizard reaches step 3, so it's already in cache by the time it does.
  const approvalWorkflowQuery = useHandoutApprovalWorkflowQuery();
  const approvalRows = mapHandoutApprovalWorkflowToRows(
    approvalWorkflowQuery.data,
  );

  // Any failed validation (Next or Submit) lands on the step that holds it.
  useEffect(() => {
    if (Object.values(errors).some(Boolean)) {
      setStep(STEP.DETAILS);
    } else if (itemErrors.form || Object.keys(itemErrors.items).length > 0) {
      setStep(STEP.ITEMS);
    }
  }, [errors, itemErrors]);

  const backButton = (
    <Button
      type="button"
      text="Back"
      Icon={ArrowLeft}
      size="sm"
      appearance="standard"
      variant="outline"
      disabled={form.submitting}
      onClick={() => setStep((current) => (current - 1) as Step)}
    />
  );

  const nextButton = (onClick: () => void) => (
    <Button
      type="button"
      text="Next"
      Icon={ArrowRight}
      iconPosition="right"
      size="sm"
      appearance="standard"
      variant="brand"
      onClick={onClick}
    />
  );

  /* ------------------------------ Step bodies ----------------------------- */

  const renderDetails = () => (
    <Card
      title="Handout Details"
      subtitle="Requested by, designation and department are taken from your profile."
      footer={
        <StepFooter
          start={
            <Button
              type="button"
              text="Cancel"
              size="sm"
              appearance="standard"
              variant="outline"
              onClick={() =>
                navigate(
                  isResubmitMode
                    ? `${HANDOUTS_BASE_PATH}/${resubmitId}`
                    : HANDOUTS_BASE_PATH,
                )
              }
            />
          }
          end={nextButton(() => {
            if (form.validateDetails()) setStep(STEP.ITEMS);
          })}
        />
      }
    >
      <HandoutDetailsFields
        mode="edit"
        values={values}
        errors={errors}
        setField={setField}
        setAddressField={setAddressField}
      />
    </Card>
  );

  const renderItems = () => (
    <div className="handout-split">
      <Card
        padding="compact"
        title="CRF Items"
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={crfSearchPlaceholder("SOUVENIR")}
          />
        }
      >
        {/* The Request list replaces CrfCatalog's own cart, which
		    handouts.css hides inside .handout-catalog. */}
        <div className="handout-catalog">
          <CrfCatalog
            options={[]}
            categories={SOUVENIR_ONLY}
            defaultCategory="SOUVENIR"
            items={form.items}
            onChange={form.setItems}
            errors={itemErrors}
            search={search}
            onSearchChange={setSearch}
            hideToolbar
          />
        </div>
      </Card>

      <HandoutRequestList
        items={form.items}
        onChange={form.setItems}
        errors={itemErrors}
        footer={
          <StepFooter
            start={backButton}
            end={nextButton(() => {
              if (form.validateItemsStep()) setStep(STEP.REVIEW);
            })}
          />
        }
      />
    </div>
  );

  const renderReview = () => {
    // The cart → the table the approver sees, so the review matches it.
    const reviewItems: HandoutItem[] = form.items.map((line, index) => ({
      id: line.id ?? `${line.sku ?? line.value}-${index}`,
      sku: line.sku ?? "",
      title: line.label || line.sku || "Item",
      variantTitle: line.variantTitle ?? null,
      imageUrl: line.imageUrl ?? null,
      quantity: toNumber(line.quantity),
      rate: toNumber(line.rate),
      amount: toNumber(line.quantity) * toNumber(line.rate),
    }));

    return (
      <Card
        title="Review & Submit"
        subtitle={
          isResubmitMode
            ? "Check the updated details below. Resubmit sends it back for approval."
            : "Check the details below. Submit sends the request for approval."
        }
        footer={
          <StepFooter
            start={backButton}
            end={
              <Button
                type="button"
                text={
                  form.submitting
                    ? isResubmitMode
                      ? "Resubmitting..."
                      : "Submitting..."
                    : isResubmitMode
                      ? "Resubmit for approval"
                      : "Submit for approval"
                }
                Icon={Send}
                size="sm"
                appearance="standard"
                variant="brand"
                disabled={form.submitting}
                onClick={() => void form.submit()}
              />
            }
          />
        }
      >
        <div className="flex min-w-0 flex-col gap-4">
          <section className="min-w-0">
            <FormHeader title="Handout Details" Icon={ClipboardList} />
            <div className="px-3">
              <HandoutDetailsFields mode="view" values={values} />
            </div>
          </section>

          <section className="min-w-0">
            <FormHeader title="CRF Items" Icon={ClipboardList} />
            <HandoutItemsTable items={reviewItems} />
          </section>

          <section className="min-w-0">
            <FormHeader title="Approval Workflow" Icon={Truck} />
            {/* Handouts have a fixed two-stage flow with no workflow-engine
                template behind it, so this is EPC's own ApprovalTable
                component (modules/workflows/components/ApprovalTable.tsx)
                fed GET /handouts/approval-workflow's real response — the
                actual configured approver and delivery person, mapped by
                handoutApprovalWorkflow.mapper.ts — rather than a hardcoded
                label. The "status" column is hidden the same way EPC hides
                it at its own review step (WorkflowViewForm.tsx's
                HIDDEN_DRAFT_COLUMNS): nothing has happened yet, so there's
                nothing to show there. */}
            <div className="px-3">
              {/* Mirrors EPC's own review-step convention in
                  WorkflowViewForm.tsx (HIDDEN_DRAFT_COLUMNS = ["status"]):
                  at review time nothing has happened yet, so there is no
                  per-approver status to show. */}
              <ApprovalTable
                data={approvalRows}
                hiddenColumns={["status"]}
                emptyTitle={
                  approvalWorkflowQuery.isLoading
                    ? "Loading approval workflow…"
                    : "Approval workflow unavailable"
                }
                emptyDescription={
                  approvalWorkflowQuery.isLoading
                    ? undefined
                    : "The approver and delivery team could not be loaded right now."
                }
              />
            </div>
          </section>
        </div>
      </Card>
    );
  };

  if (!canRequest) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="New handout request"
          subtitleText="You do not have access to raise handout requests."
        />
      </PageSectionLayout>
    );
  }

  if (isResubmitMode && resubmitLoading) {
    return (
      <PageSectionLayout>
        <PageHeader headerText="Loading request…" />
      </PageSectionLayout>
    );
  }

  if (isResubmitMode && (resubmitError || !resubmitHandout)) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText="Resubmit handout request"
          subtitleText="This request could not be loaded, or you may not have access to it."
        />
      </PageSectionLayout>
    );
  }

  if (
    isResubmitMode &&
    resubmitHandout &&
    !resubmitHandout.permissions.canResubmit
  ) {
    return (
      <PageSectionLayout>
        <PageHeader
          headerText={resubmitHandout.requestNumber}
          subtitleText="This request is not awaiting resubmission."
        />
      </PageSectionLayout>
    );
  }

  return (
    <PageSectionLayout>
      <PageHeader
        headerText={
          isResubmitMode
            ? `Resubmit ${resubmitHandout?.requestNumber}`
            : "New handout request"
        }
        subtitleText={
          isResubmitMode
            ? "Update the details or items the approver asked about, then resubmit."
            : "Request souvenirs for premises use. One approver, then hand delivery by the delivery team."
        }
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "New handout page location",
          breadcrumbs: [
            { label: "Home Screen", href: "/" },
            { label: "Handouts", href: HANDOUTS_BASE_PATH },
            { label: isResubmitMode ? "Resubmit" : "New request" },
          ],
          separator: "›",
        }}
      />

      <StepProgress
        steps={STEPS}
        currentStep={step}
        ariaLabel="New handout progress"
        className="workflow-create-step-progress"
      />

      {step === STEP.DETAILS
        ? renderDetails()
        : step === STEP.ITEMS
          ? renderItems()
          : renderReview()}
    </PageSectionLayout>
  );
}
