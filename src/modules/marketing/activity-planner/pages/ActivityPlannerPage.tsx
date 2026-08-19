import React from "react";
import { useParams } from "react-router-dom";

import Loader from "../../../../components/ui/Loader";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import ActivityFormView from "../components/activityFormView/ActivityFormView";
import ActivityPlannerHeader from "../components/activityFormView/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/activityFormView/ActivityPlannerPdfPreview";
import EventReportUploadForm from "../forms/EventReport/eventReportUploadForm";
import { useActivityPlanner } from "../hooks/useActivityPlanner";
import {
  useEventReportQuery,
  useEventReportFormConfigQuery,
} from "../forms/EventReport/useEventReportQueries";
import { getEventReportSectionState } from "../forms/EventReport/eventReport.logic";
import { useReportGenerationWatcher } from "../forms/EventReport/useReportGenerationWatcher";

type PageView = "form" | "report-builder";

const ActivityPlannerPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    epcData,
    workflowEntries,
    permissions,
    isLoading,
    isFetching,
    proposerName,
    isValidatingReport,
    handleRefresh,
    handleValidateReport,
    isSubmittingClarifiedUpdate,
    submitClarifiedUpdate,
    isSubmittingDeviationUpdate,
    submitDeviationUpdate,
    isClosingEPC,
    handleCloseEPC,
  } = useActivityPlanner(id);

  // Report data/config now come from the report's own query hooks, not
  // useActivityPlanner — the old flow fetched report data as part of the
  // combined EPC hook; the new async-generation model needs its own
  // query so it can be invalidated/refetched independently of the rest
  // of the EPC (e.g. after a REPORT_STATUS notification arrives).
  const { data: report, refetch: refetchReport } = useEventReportQuery(id);
  const { data: formConfig } = useEventReportFormConfigQuery(id);
  useReportGenerationWatcher(id);

  const [pageView, setPageView] = React.useState<PageView>("form");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [editingSection, setEditingSection] = React.useState<
    "epc" | "crf" | "epf" | null
  >(null);

  const isProposer = permissions?.isProposer ?? false;
  const isValidator = permissions?.isValidator ?? false;
  const canCreateReport = permissions?.canCreateReport ?? false;

  const { canProposerCreate, canProposerResubmit, canProposerRetry } =
    getEventReportSectionState({
      report,
      isProposer,
      isValidator,
      canCreateReport,
    });

  // Which mode EventReportUploadForm operates in — derived from section
  // state rather than duplicated here, so the button that opens the
  // builder and the form it opens never disagree about what action is
  // actually being taken.
  const reportBuilderMode: "create" | "resubmit" | "retry" = canProposerRetry
    ? "retry"
    : canProposerResubmit
      ? "resubmit"
      : "create";

  const openReportBuilder = React.useCallback(() => {
    setPageView("report-builder");
  }, []);

  const closeReportBuilder = React.useCallback(() => {
    setPageView("form");
  }, []);

  const handleDownloadReport = React.useCallback(() => {
    if (report?.pdfUrl) {
      window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
    }
  }, [report?.pdfUrl]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <PageRowSectionLayout
        contentMode="page-scroll"
        stickyHeader
        stickyTop="0px"
        className="activity-planner-layout"
        pageHeaderClassName="activity-planner-layout-page-header"
        headerClassName="activity-planner-layout-header"
        headerBodyClassName="activity-planner-layout-header-body"
        contentClassName="activity-planner-layout-content"
        contentBodyClassName="activity-planner-layout-content-body"
        pageHeader={
          <PageHeader
            headerText="Activity Form View"
            className="activity-planner-page-header"
            navigation={{
              variant: "breadcrumbs",
              ariaLabel: "Activity planner location",
              breadcrumbs: [
                { label: "Home Screen", href: "/" },
                {
                  label: "EPC Listing",
                  href: "/marketing/activity-planner/listing",
                },
                { label: "Form View" },
              ],
              separator: "›",
            }}
          />
        }
        header_children={
          <ActivityPlannerHeader
            epcData={epcData ?? null}
            loading={isFetching}
            proposerName={proposerName}
            onPreview={() => setIsPreviewOpen(true)}
          />
        }
      >
        {pageView === "report-builder" ? (
          <div className="activity-planner-report-builder">
            <EventReportUploadForm
              epcId={id!}
              formConfig={formConfig}
              existingReport={report}
              mode={reportBuilderMode}
              onBack={closeReportBuilder}
              onSuccess={async () => {
                setPageView("form");
                await handleRefresh();
                await refetchReport();
              }}
            />
          </div>
        ) : (
          <ActivityFormView
            epcData={epcData ?? null}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            onRefresh={handleRefresh}
            report={report}
            permissions={permissions}
            isValidatingReport={isValidatingReport}
            isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
            onOpenReportBuilder={openReportBuilder}
            onDownloadReport={handleDownloadReport}
            onValidateReport={handleValidateReport}
            onSubmitClarifiedUpdate={submitClarifiedUpdate}
            isSubmittingDeviationUpdate={isSubmittingDeviationUpdate}
            onSubmitDeviationUpdate={submitDeviationUpdate}
            onEPCClose={handleCloseEPC}
            isEPCClose={isClosingEPC}
          />
        )}
      </PageRowSectionLayout>

      <ActivityPlannerPdfPreview
        open={isPreviewOpen}
        epcData={epcData ?? null}
        createdBy={proposerName}
        workflowEntries={workflowEntries}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

export default ActivityPlannerPage;
