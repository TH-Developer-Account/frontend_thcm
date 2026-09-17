import React, { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Loader from "../../../../components/ui/Loader";
import ActivityFormView from "../components/activityFormView/ActivityFormView";
import EventReportTemplate from "../forms/EventReport/EventReportTemplate";
import { useActivityPlanner } from "../hooks/useActivityPlanner";
import PageSectionLayout from "../../../../layout/PageSectionLayout";

const EventReportPreview = lazy(
	() => import("../forms/EventReport/EventReportPreview"),
);

type PageView = "form" | "report-builder" | "report-preview";

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();
	const [pageView, setPageView] = React.useState<PageView>("form");

	const showReportBuilder = React.useCallback(() => {
		setPageView("report-builder");
	}, []);

	const showReportPreview = React.useCallback(() => {
		setPageView("report-preview");
	}, []);

	const closeReportView = React.useCallback(() => {
		setPageView("form");
	}, []);

	const activity = useActivityPlanner(id, {
		onOpenReportBuilder: showReportBuilder,
		onOpenReportPreview: showReportPreview,
	});

	const {
		epcData,
		reportData,
		reportQuery,
		isLoading,
		exportState,
		handleExport,
		dismissExport,
		handleOpenReportPreview,
	} = activity;

	const handleReportSaved = React.useCallback(() => {
		setPageView("form");
	}, []);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<>
			<PageSectionLayout>
				{exportState.status === "queued" && (
					<Alert
						type="banner"
						variant="info"
						title="Export queued"
						description={`${exportState.message} Once the export is complete, the file will be shown in Notifications and can be downloaded from there.`}
						secondaryAction={{
							label: "Dismiss",
							onClick: dismissExport,
						}}
					/>
				)}

				{exportState.status === "error" && (
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
				)}
				{pageView === "report-builder" ? (
					<div
						id="event-report-pdf-content"
						className="activity-planner-report-builder"
					>
						<EventReportTemplate
							epcId={id!}
							eventCost={epcData?.epf?.eventBudget || 0}
							initialReport={reportData}
							onBack={closeReportView}
							onPreview={handleOpenReportPreview}
							onSuccess={handleReportSaved}
						/>
					</div>
				) : (
					<ActivityFormView activity={activity} />
				)}
			</PageSectionLayout>

			{pageView === "report-preview" && (
				<Suspense fallback={<Loader />}>
					<EventReportPreview
						open
						onClose={closeReportView}
						epcData={epcData ?? null}
						report={reportData}
						loading={reportQuery.isLoading || reportQuery.isFetching}
					/>
				</Suspense>
			)}
		</>
	);
};

export default ActivityPlannerPage;
