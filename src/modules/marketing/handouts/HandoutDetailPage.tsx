// handouts/HandoutDetailPage.tsx
// One request, three audiences. What shows is driven by the server's
// `permissions` flags on GET /handouts/:id, not re-derived from roles here:
//   approver      → Approve / Reject / Send for clarification while pending
//   delivery team → check items + hand-over details, then "Request fulfilled" or
//                   "Request can't be fulfilled" — a reason is required for both
//   requester     → Cancel while pending, or Resubmit once clarification
//                   was requested (reopens the New Handout wizard, prefilled)
//
// Same structure as ActivityFormView (DetailPageLayout):
//   header : back + request no. + status (left) · tabs (right)
//   main   : the active tab's card
//   side   : audit trail (AuditLogSection), then the decision card(s)
//
// Cancel reuses ApprovalActionsBar's own reason box: it's rendered as its
// own small card with only the "clarify" slot wired (relabeled), since it's
// a single action on its own. Approve/Reject/Clarify together need a THIRD
// reason-action on one card, which ApprovalActionsBar's "approver" + "card"
// layout doesn't support (it only ever renders approveButton + clarifyButton)
// — so those three share one purpose-built HandoutApproverDecisionCard
// instead, rather than a change to the shared bar (also used by CRF, medical
// claims and vendor onboarding).
//
// Tabs: Handout Info · CRF Items · Delivery (once delivered).

import { useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import NavigateButton from "../../../components/common/NavigateButton";
import { TabsBar } from "../../../components/common/TabsBar";
import type { TabItem } from "../../../components/common/common.types";
import Card from "../../../components/common/Card";
import FormInput from "../../../components/forms/FormInput";
import TextareaInput from "../../../components/forms/TextareaInput";
import { AuditLogSection } from "../../../components/ui/audit";
import ApprovalActionsBar from "../../../components/ui/ApprovalActionsBar";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import DetailPageLayout from "../../../layout/DetailPageLayout";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../utils/apiError.helper";
import "../activity-planner/utils/activity-planner.styles.css";

import {
  HANDOUT_AUDIT_MESSAGES,
  HANDOUT_AUDIT_SUBJECT,
  handoutAuditApi,
  handoutKeys,
  useApproveHandoutMutation,
  useCancelHandoutMutation,
  useHandoutQuery,
  useHandoutStockQuery,
  useCannotFulfilHandoutMutation,
  useClarifyHandoutMutation,
  useRejectHandoutMutation,
} from "./handouts.api";
import {
  HANDOUT_STATUS_LABEL,
  HANDOUT_STATUS_TONE,
  HANDOUTS_BASE_PATH,
} from "./handouts.constants";
import { formatHandoutDateTime } from "./handouts.format";
import { detailsFromHandout } from "./handouts.schema";
import HandoutApproverDecisionCard from "./HandoutApproverDecisionCard";
import HandoutDetailsFields from "./HandoutDetailsFields";
import HandoutDeliveryPanel, {
  useHandoutDelivery,
} from "./HandoutDeliveryPanel";
import HandoutItemsTable from "./HandoutItemsTable";
import "./handouts.css";

/* ========================================================================== */
/*                                    Tabs                                    */
/* ========================================================================== */

type HandoutTab = "info" | "items" | "delivery";

const TAB_TITLES: Record<HandoutTab, string> = {
  info: "Handout Information",
  items: "CRF Items",
  delivery: "Delivery",
};

export default function HandoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: handout, isLoading, error } = useHandoutQuery(id);

  // Live availability only matters while a decision / delivery is pending.
  const needsStock =
    handout?.status === "PENDING_APPROVAL" || handout?.status === "APPROVED";
  const stockQuery = useHandoutStockQuery(handout?.items ?? [], needsStock);

  const approve = useApproveHandoutMutation();
  const reject = useRejectHandoutMutation();
  const clarify = useClarifyHandoutMutation();
  const cancel = useCancelHandoutMutation();
  const cannotFulfil = useCannotFulfilHandoutMutation();
  // null = not chosen yet: the delivery team lands on the items tab.
  const [selectedTab, setSelectedTab] = useState<HandoutTab | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: handoutKeys.all });

  const back = () => navigate(HANDOUTS_BASE_PATH);

  // Delivery team's form state, shared by the Items tab and the decision card.
  const delivery = useHandoutDelivery(handout, refresh);

  if (isLoading) {
    return (
      <PageSectionLayout>
        <PageHeader headerText="Loading request…" />
      </PageSectionLayout>
    );
  }

  if (error || !handout) {
    return (
      <PageSectionLayout>
        <PageHeader headerText="Handout request" />
        <Alert
          type="banner"
          variant="error"
          title="Request not found"
          description="It may have been removed, or you may not have access to it."
        />
        <Button
          type="button"
          text="Back to Handouts"
          Icon={ArrowLeft}
          iconPosition="left"
          appearance="standard"
          variant="outline"
          size="sm"
          onClick={back}
        />
      </PageSectionLayout>
    );
  }

  const { permissions } = handout;
  const stock = stockQuery.data;
  const shortLines = (stock?.lines ?? []).filter(
    (line) => line.status !== "AVAILABLE",
  );

  /* ------------------------------ Actions ------------------------------- */

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(handout.id);
      await refresh();
      showSuccessToast(
        showToast,
        `${handout.requestNumber} was approved and sent to the delivery team.`,
        "Request approved",
      );
    } catch (err) {
      showApiErrorToast(
        showToast,
        err,
        "The request could not be approved.",
        "Unable to approve",
      );
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await reject.mutateAsync({ id: handout.id, reason });
      await refresh();
      showSuccessToast(
        showToast,
        `${handout.requestNumber} was rejected.`,
        "Request rejected",
      );
    } catch (err) {
      showApiErrorToast(
        showToast,
        err,
        "The request could not be rejected.",
        "Unable to continue",
      );
    }
  };

  // The decision card's reason box supplies the reason for both of these.
  const handleClarify = async (reason: string) => {
    try {
      await clarify.mutateAsync({ id: handout.id, reason });
      await refresh();
      showSuccessToast(
        showToast,
        `${handout.requestNumber} was sent back to the requester.`,
        "Clarification requested",
      );
    } catch (err) {
      showApiErrorToast(
        showToast,
        err,
        "The request could not be sent for clarification.",
        "Unable to continue",
      );
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      await cancel.mutateAsync({ id: handout.id, reason });
      await refresh();
      showSuccessToast(
        showToast,
        `${handout.requestNumber} was cancelled.`,
        "Request cancelled",
      );
    } catch (err) {
      showApiErrorToast(
        showToast,
        err,
        "The request could not be cancelled.",
        "Unable to continue",
      );
    }
  };

  const handleResubmit = () => {
    navigate(`${HANDOUTS_BASE_PATH}/new?resubmitId=${handout.id}`);
  };

  const handleCannotFulfil = async (reason: string) => {
    try {
      await cannotFulfil.mutateAsync({ id: handout.id, reason });
      await refresh();
      showSuccessToast(
        showToast,
        `${handout.requestNumber} was marked as cannot be fulfilled.`,
        "Request closed",
      );
    } catch (err) {
      showApiErrorToast(
        showToast,
        err,
        "The request could not be updated.",
        "Unable to continue",
      );
    }
  };

  /* -------------------------------- Tabs -------------------------------- */

  const tabs: TabItem<HandoutTab>[] = [
    { value: "info", label: "Handout Info" },
    { value: "items", label: "CRF Items" },
    ...(handout.delivery
      ? [{ value: "delivery", label: "Delivery" } as TabItem<HandoutTab>]
      : []),
  ];

  const defaultTab: HandoutTab = permissions.canDeliver ? "items" : "info";
  const currentTab: HandoutTab =
    selectedTab && tabs.some((tab) => tab.value === selectedTab)
      ? selectedTab
      : defaultTab;

  const renderTab = () => {
    switch (currentTab) {
      case "info":
        return (
          <Card key="info" title={TAB_TITLES.info}>
            {/* The same form as the New request page, in view mode. */}
            <HandoutDetailsFields
              mode="view"
              values={detailsFromHandout(handout)}
              meta={{
                requestedBy: handout.requestedByName,
                designation: handout.requestedByDesignation,
                department: handout.requestedByDepartment,
                requestedOn: handout.createdAt,
              }}
            />
          </Card>
        );

      case "items":
        // The delivery team verifies items and hands over from here; everyone
        // else gets the read-only table.
        return permissions.canDeliver ? (
          <div key="items" className="handout-stack">
            <HandoutDeliveryPanel
              handout={handout}
              stock={stock}
              stockLoading={stockQuery.isLoading}
              delivery={delivery}
            />
          </div>
        ) : (
          <Card key="items" padding="none" title={TAB_TITLES.items}>
            <HandoutItemsTable
              items={handout.items}
              stock={needsStock ? stock : undefined}
              stockLoading={needsStock && stockQuery.isLoading}
            />
          </Card>
        );

      case "delivery":
        return handout.delivery ? (
          <Card key="delivery" title={TAB_TITLES.delivery}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormInput
                mode="view"
                name="handedTo"
                label="Handed To"
                value={handout.delivery.handedToName}
              />
              <FormInput
                mode="view"
                name="deliveredOn"
                label="Delivered On"
                value={formatHandoutDateTime(handout.delivery.deliveredOn)}
              />
              <FormInput
                mode="view"
                name="deliveredBy"
                label="Delivered By"
                value={handout.delivery.deliveredByName}
              />
              <div className="min-w-0 md:col-span-2 xl:col-span-3">
                <TextareaInput
                  mode="view"
                  name="deliveryNote"
                  label="Delivery Note"
                  value={handout.delivery.note ?? ""}
                />
              </div>
            </div>
          </Card>
        ) : null;
    }
  };

  const showApproverCard = permissions.canApprove || permissions.canClarify;
  const showRejectCard = permissions.canReject;
  const showCancelCard = permissions.canCancel;
  const showDeliveryCard =
    permissions.canDeliver || permissions.canCannotFulfil;
  const lastComment = [...handout.timeline].reverse().find((e) => e.comment);

  /* ------------------------------- Render ------------------------------- */

  return (
    <PageSectionLayout>
      {/* className keeps the page-level CSS variables scoped, as on the EPC page. */}
      <DetailPageLayout className="activity-form-view">
        {/* ── Header: back + title (left) · tabs (right) ── */}
        <DetailPageLayout.Header
          back={<NavigateButton direction="back" />}
          title={handout.requestNumber}
          badge={
            <Badge
              status={handout.status}
              variant={HANDOUT_STATUS_TONE[handout.status]}
              text={HANDOUT_STATUS_LABEL[handout.status]}
            />
          }
          subtitle={`${handout.purpose} · ${handout.requestedByName}`}
        >
          <TabsBar<HandoutTab>
            items={tabs}
            active={currentTab}
            onChange={setSelectedTab}
            variant="soft"
            ariaLabel="Handout sections"
          />
        </DetailPageLayout.Header>

        {handout.status === "REJECTED" && handout.rejectionReason ? (
          <Alert
            type="banner"
            variant="error"
            title="Rejected"
            description={handout.rejectionReason}
          />
        ) : null}

        {handout.status === "CLARIFICATION_REQUESTED" ||
        handout.status === "CANNOT_FULFIL" ? (
          <Alert
            type="banner"
            variant={handout.status === "CANNOT_FULFIL" ? "error" : "warning"}
            title={HANDOUT_STATUS_LABEL[handout.status]}
            description={
              handout.status === "CLARIFICATION_REQUESTED" &&
              permissions.canResubmit
                ? `${lastComment?.comment ?? ""} Update the request and resubmit it for approval.`
                : (lastComment?.comment ?? "")
            }
          />
        ) : null}

        {/* Tracking: shown to everyone with access once THCM's webhook has
				    reported it for a SHIPPED handout — purely informational, the
				    request still only closes through the delivery team's manual
				    "Request fulfilled" action below. */}
        {/* NOTE: Alert's props elsewhere in this file are only type/variant/
				    title/description (all plain strings) — I haven't seen Alert.tsx
				    itself, so I'm not assuming it takes a node/action slot for the
				    link. Description stays plain text with the raw tracking URL;
				    swap this for a proper link-in-description once you confirm
				    what Alert actually supports. */}
        {handout.tracking ? (
          <Alert
            type="banner"
            variant="info"
            title="Tracking available"
            description={`Tracking ID: ${handout.tracking.trackingNumber} — ${handout.tracking.trackingUrl}`}
          />
        ) : null}

        {/* Stock shortfall: the requester and approver see it; the delivery
				    team does not (they get "Request can't be fulfilled" instead). */}
        {shortLines.length > 0 && needsStock && !permissions.canDeliver ? (
          <Alert
            type="banner"
            variant="warning"
            title="Stock shortage"
            description={`${shortLines.length} ${
              shortLines.length === 1 ? "item has" : "items have"
            } less stock than requested.${
              permissions.canClarify
                ? " Use Send for clarification so the requester can change the items and resubmit."
                : ""
            }`}
          />
        ) : null}

        <DetailPageLayout.Body>
          {/* ── Main: the active tab's card ── */}
          <DetailPageLayout.Main>{renderTab()}</DetailPageLayout.Main>

          {/* ── Side: activity (audit), then the decision card(s) ── */}
          <DetailPageLayout.Side label="Approval and activity">
            <Card
              className="activity-form-view-panel activity-form-view-panel--audit"
              accordion
              defaultExpanded
              title={
                <span className="activity-form-view-panel-title">
                  <History size={15} aria-hidden="true" />
                  Audit Trail
                </span>
              }
              padding="none"
              bodyClassName="activity-form-view-panel-body"
            >
              <AuditLogSection
                subjectType={HANDOUT_AUDIT_SUBJECT}
                subjectId={handout.id}
                entityName="handout request"
                refreshKey={`${handout.status}-${handout.timeline.length}`}
                api={handoutAuditApi}
                actionMessages={HANDOUT_AUDIT_MESSAGES}
              />
            </Card>

            {/* Requester: resubmit once clarification was requested. No
						    reason box — the wizard is where the edit happens. */}
            {permissions.canResubmit && (
              <Card
                className="activity-form-view-panel"
                title="Clarification requested"
              >
                <p className="mb-3 text-sm text-iron-muted">
                  Update the request with what the approver asked for, then
                  resubmit it for approval.
                </p>
                <Button
                  type="button"
                  text="Resubmit request"
                  size="sm"
                  appearance="standard"
                  variant="brand"
                  onClick={handleResubmit}
                />
              </Card>
            )}

            {/* Requester: withdraw the request outright. */}
            {showCancelCard && (
              <ApprovalActionsBar
                variant="approver"
                layout="card"
                showBack={false}
                eyebrow="Your request"
                title="Cancel this request"
                subtitle="Withdraws it before the approver decides. This cannot be undone."
                clarifyLabel="Cancel request"
                canClarify
                minReasonLength={5}
                reasonPlaceholder="Why is this request being cancelled?"
                onClarify={(reason) => handleCancel(reason)}
                loading={cancel.isPending}
              />
            )}

            {/* Approver: Approve, Reject or send back for clarification —
						    one reason box, three buttons. */}
            {(showApproverCard || showRejectCard) && (
              <HandoutApproverDecisionCard
                canApprove={permissions.canApprove}
                canReject={permissions.canReject}
                canClarify={permissions.canClarify}
                onApprove={handleApprove}
                onReject={handleReject}
                onClarify={handleClarify}
              />
            )}

            {/* Delivery team: fulfilled or not — a reason is required either way. */}
            {showDeliveryCard && (
              <ApprovalActionsBar
                variant="approver"
                layout="card"
                showBack={false}
                eyebrow="Delivery"
                title="Awaiting delivery"
                // subtitle="Check the items and fill in the hand-over details, then say whether the request was fulfilled."
                approveLabel="Request fulfilled"
                clarifyLabel="Request can't be fulfilled"
                canApprove={permissions.canDeliver}
                canClarify={permissions.canCannotFulfil}
                approveDisabled={!delivery.canFulfil}
                minReasonLength={5}
                reasonPlaceholder="Required: add a note for the outcome"
                onApprove={(reason) => delivery.submit(reason ?? "")}
                onClarify={(reason) => handleCannotFulfil(reason)}
                loading={delivery.isSubmitting || cannotFulfil.isPending}
              />
            )}
          </DetailPageLayout.Side>
        </DetailPageLayout.Body>
      </DetailPageLayout>
    </PageSectionLayout>
  );
}
