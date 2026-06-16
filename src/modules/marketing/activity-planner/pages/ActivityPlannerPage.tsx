import React from "react";
import { useParams } from "react-router-dom";

import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import Loader from "../../../../components/ui/Loader";
import ActivityFormView from "../components/activityFormView/ActivityFormView";
import ActivityPlannerHeader from "../components/activityFormView/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/activityFormView/ActivityPlannerPdfPreview";
import EventReportTemplate from "../forms/EventReport/EventReportTemplate";
import EventReportPreview from "../forms/EventReport/EventReportPreview";
import { useActivityPlanner } from "../hooks/useActivityPlanner";

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
		handleRefresh,
		handleOpenReportPreview,
		handleValidateReport,
		handleClarifyReport,
		isSubmittingClarifiedUpdate,
		submitClarifiedUpdate,
		isSubmittingDeviationUpdate,
		submitDeviationUpdate,
		handleCloseEPC,
	} = useActivityPlanner(id);

	const [pageView, setPageView] = React.useState<PageView>("form");
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	const closeReportPreview = React.useCallback(() => {
		setPageView("form");
	}, []);
	const openReportBuilder = React.useCallback(() => {
		setPageView("report-builder");
	}, []);

	const openReportPreview = React.useCallback(() => {
		handleOpenReportPreview();
		setPageView("report-preview");
	}, [handleOpenReportPreview]);
	if (isLoading) return <Loader />;

	return (
		<>
			<PageRowSectionLayout
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
					<div id="event-report-pdf-content" className="bg-white">
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

			<ActivityPlannerPdfPreview
				open={isPreviewOpen}
				epcData={epcData ?? null}
				createdBy={proposerName}
				workflowEntries={workflowEntries}
				onClose={() => setIsPreviewOpen(false)}
			/>

			{pageView === "report-preview" && (
				<EventReportPreview
					open={true}
					onClose={closeReportPreview}
					epcData={epcData ?? null}
					report={reportData}
					loading={reportQuery.isLoading || reportQuery.isFetching}
				/>
			)}
		</>
	);
};

export default ActivityPlannerPage;
