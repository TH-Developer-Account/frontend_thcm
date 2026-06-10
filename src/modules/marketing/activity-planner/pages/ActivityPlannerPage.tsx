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

type PageView = "form" | "report-builder";

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();

	const {
		epcData,
		workflowEntries,
		reportData,
		reportQuery,
		isLoading,
		isFetching,
		isProposer,
		isValidator,
		proposerName,
		hasValidatorPreviewed,
		isValidatingReport,
		isClarifyingReport,
		isClosingEPC,
		handleRefresh,
		handleOpenReportPreview,
		handleValidateReport,
		handleClarifyReport,
		isClarifiedPending,
		canSubmitClarifiedUpdate,
		isSubmittingClarifiedUpdate,
		submitClarifiedUpdate,
		canSubmitDeviationUpdate,
		isDeviationPending,
		isSubmittingDeviationUpdate,
		submitDeviationUpdate,
		handleCloseEPC,
	} = useActivityPlanner(id);

	const [pageView, setPageView] = React.useState<PageView>("form");
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
	const [isReportPreviewOpen, setReportIsPreviewOpen] = React.useState(false);
	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	if (isLoading) return <Loader />;

	return (
		<>
			<PageRowSectionLayout
				header_children={
					<ActivityPlannerHeader
						epcData={epcData ?? null}
						loading={isFetching}
						createdBy={proposerName}
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
							onPreview={() =>
								handleOpenReportPreview(() => setReportIsPreviewOpen(true))
							}
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
						isProposer={Boolean(isProposer)}
						isValidator={Boolean(isValidator)}
						hasValidatorPreviewed={hasValidatorPreviewed}
						isValidatingReport={isValidatingReport}
						isClarifyingReport={isClarifyingReport}
						isClarifiedPending={isClarifiedPending}
						isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
						onOpenReportBuilder={() => setPageView("report-builder")}
						onOpenReportPreview={() =>
							handleOpenReportPreview(() => setReportIsPreviewOpen(true))
						}
						onValidateReport={handleValidateReport}
						onClarifyReport={handleClarifyReport}
						onSubmitClarifiedUpdate={submitClarifiedUpdate}
						canSubmitClarifiedUpdate={canSubmitClarifiedUpdate}
						canSubmitDeviationUpdate={canSubmitDeviationUpdate}
						isDeviationPending={isDeviationPending}
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

			{isReportPreviewOpen && (
				<EventReportPreview
					open={isReportPreviewOpen}
					onClose={() => setReportIsPreviewOpen(false)}
					epcData={epcData ?? null}
					report={reportData}
					loading={reportQuery.isLoading || reportQuery.isFetching}
				/>
			)}
		</>
	);
};

export default ActivityPlannerPage;
