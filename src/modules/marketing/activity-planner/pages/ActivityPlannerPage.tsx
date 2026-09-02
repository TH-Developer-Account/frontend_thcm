import React, { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

import Loader from "../../../../components/ui/Loader";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import ActivityFormView from "../components/activityFormView/ActivityFormView";
import ActivityPlannerHeader from "../components/activityFormView/ActivityPlannerHeader";
import EventReportTemplate from "../forms/EventReport/EventReportTemplate";
import { useActivityPlanner } from "../hooks/useActivityPlanner";
import { Alert } from "../../../../components/common/Alert";
import { navigateToDownloadUrl } from "../../../../utils/exportJob.helper";

const ActivityPlannerPdfPreview = lazy(
	() => import("../components/activityFormView/ActivityPlannerPdfPreview"),
);

const EventReportPreview = lazy(
	() => import("../forms/EventReport/EventReportPreview"),
);

type PageView = "form" | "report-builder" | "report-preview";

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();

	const {
		epcData,
		workflowEntries,
		reportData,
		reportQuery,
		permissions,

		isLoading,
		isFetching,
		proposerName,
		hasValidatorPreviewed,

		isValidatingReport,
		isClarifyingReport,
		isClosingEPC,

		isPreparingPdf,
		isDownloadingPdf,
		isExportingExcel,
		exportState,

		handleDownloadPdf,
		handleExport,
		dismissExport,

		handleRefresh,
		handleOpenReportPreview,
		handleValidateReport,
		handleClarifyReport,
		handleCloseEPC,

		isSubmittingClarifiedUpdate,
		submitClarifiedUpdate,
		isSubmittingDeviationUpdate,
		submitDeviationUpdate,
	} = useActivityPlanner(id);

	const [pageView, setPageView] = React.useState<PageView>("form");

	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	const closeReportPreview = React.useCallback(() => {
		setPageView("form");
	}, []);

	const openActivityPlannerPreview = React.useCallback(() => {
		setIsPreviewOpen(true);
	}, []);

	const openReportBuilder = React.useCallback(() => {
		setPageView("report-builder");
	}, []);

	const openReportPreview = React.useCallback(() => {
		handleOpenReportPreview();
		setPageView("report-preview");
	}, [handleOpenReportPreview]);

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
								{
									label: "Home Screen",
									href: "/",
								},
								{
									label: "EPC Listing",
									href: "/marketing/activity-planner/listing",
								},
								{
									label: "Form View",
								},
							],
							separator: "›",
						}}
					/>
				}
				header_children={
					<>
						{exportState.status === "delayed" ? (
							<Alert
								type="banner"
								variant="info"
								title="Still exporting…"
								description="This is taking longer than usual. We'll let you know the moment it's ready."
							/>
						) : null}

						{exportState.status === "ready" ? (
							<Alert
								type="banner"
								variant="success"
								title="Export ready"
								description="Your activity planner export is ready to download."
								primaryAction={{
									label: "Download",
									onClick: () => navigateToDownloadUrl(exportState.downloadUrl),
								}}
								secondaryAction={{
									label: "Dismiss",
									onClick: dismissExport,
								}}
							/>
						) : null}

						{exportState.status === "error" ? (
							<Alert
								type="banner"
								variant="error"
								title="Export failed"
								description={exportState.message}
								primaryAction={{
									label: "Retry",
									onClick: handleExport,
								}}
								secondaryAction={{
									label: "Dismiss",
									onClick: dismissExport,
								}}
							/>
						) : null}

						<ActivityPlannerHeader
							epcData={epcData}
							proposerName={proposerName}
							loading={isFetching}
							onPreview={openActivityPlannerPreview}
							isPreparingPdf={isPreparingPdf}
							isDownloadingPdf={isDownloadingPdf}
							isExportingExcel={isExportingExcel}
							onDownloadPdf={handleDownloadPdf}
							onExportExcel={handleExport}
						/>
					</>
				}
			>
				{pageView === "report-builder" ? (
					<div
						id="event-report-pdf-content"
						className="activity-planner-report-builder"
					>
						<EventReportTemplate
							epcId={id!}
							eventCost={epcData?.epf?.eventBudget || 0}
							initialReport={reportData}
							onBack={() => setPageView("form")}
							onPreview={openReportPreview}
							onSuccess={async () => {
								setPageView("form");
								await handleRefresh();
								await reportQuery.refetch();
							}}
						/>
					</div>
				) : (
					<ActivityFormView
						epcData={epcData ?? null}
						editingSection={editingSection}
						setEditingSection={setEditingSection}
						onRefresh={handleRefresh}
						report={reportData}
						permissions={permissions}
						hasValidatorPreviewed={hasValidatorPreviewed}
						isValidatingReport={isValidatingReport}
						isClarifyingReport={isClarifyingReport}
						isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
						onOpenReportBuilder={openReportBuilder}
						onOpenReportPreview={openReportPreview}
						onValidateReport={handleValidateReport}
						onClarifyReport={handleClarifyReport}
						onSubmitClarifiedUpdate={submitClarifiedUpdate}
						isSubmittingDeviationUpdate={isSubmittingDeviationUpdate}
						onSubmitDeviationUpdate={submitDeviationUpdate}
						onEPCClose={handleCloseEPC}
						isEPCClose={isClosingEPC}
					/>
				)}
			</PageRowSectionLayout>

			{isPreviewOpen ? (
				<Suspense fallback={<Loader />}>
					<ActivityPlannerPdfPreview
						open
						epcData={epcData ?? null}
						createdBy={proposerName}
						workflowEntries={workflowEntries}
						onClose={() => setIsPreviewOpen(false)}
					/>
				</Suspense>
			) : null}

			{pageView === "report-preview" ? (
				<Suspense fallback={<Loader />}>
					<EventReportPreview
						open
						onClose={closeReportPreview}
						epcData={epcData ?? null}
						report={reportData}
						loading={reportQuery.isLoading || reportQuery.isFetching}
					/>
				</Suspense>
			) : null}
		</>
	);
};

export default ActivityPlannerPage;
