import React from "react";
import { useParams } from "react-router-dom";

import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import Loader from "../../../../components/ui/Loader";

import ActivityFormView from "../components/ActivityFormView";
import ActivityPlannerHeader from "../components/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/ActivityPlannerPdfPreview";

import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import { useActivityCommentsQuery } from "../queries/useActivityFormQuery";
import { getEpcCreatedByName } from "../utils/formatters";
import { useClarifiedResubmission } from "../hooks/useClarifiedResubmission";
import EventReportTemplate from "../components/EventReport/EventReportTemplate";
import EventReportPreview from "../components/EventReport/EventReportPreview";

type PageView = "form" | "report-builder" | "report-view";

const dummyImages = [
	{
		url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
		caption: "Customer interaction during event",
	},
	{
		url: "https://images.unsplash.com/photo-1494526585095-c41746248156",
		caption: "Machine product showcase",
	},
	{
		url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
		caption: "Dealer networking session",
	},
	{
		url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
		caption: "Lead discussion and registrations",
	},
];

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();

	const {
		data: epcData,
		isLoading,
		isFetching,
		refetch,
	} = useEpcDetailQuery(id);

	const { data: workflowEntries = [] } = useActivityCommentsQuery(
		epcData?.id ?? null,
	);

	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
	const [isReportPreviewOpen, setReportIsPreviewOpen] = React.useState(false);
	const [pageView, setPageView] = React.useState<PageView>("form");
	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	const createdBy = getEpcCreatedByName(epcData ?? null);

	const handleRefresh = async () => {
		await refetch();
	};

	const {
		isClarifiedPending,
		isSubmittingClarifiedUpdate,
		submitClarifiedUpdate,
	} = useClarifiedResubmission({
		epcData: epcData ?? null,
		workflowEntries,
		onRefresh: handleRefresh,
	});

	if (isLoading) return <Loader />;

	return (
		<>
			<PageRowSectionLayout
				header_children={
					<ActivityPlannerHeader
						epcData={epcData ?? null}
						loading={isFetching}
						createdBy={createdBy}
						isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
						onSubmitClarifiedUpdate={submitClarifiedUpdate}
					/>
				}
			>
				{pageView === "report-builder" ? (
					<EventReportTemplate
						eventCost={epcData?.epf?.eventBudget || 0}
						onBack={() => setPageView("form")}
						onPreview={() => setReportIsPreviewOpen(true)}
					/>
				) : (
					<ActivityFormView
						epcData={epcData ?? null}
						loading={isFetching}
						onPreview={() => setIsPreviewOpen(true)}
						editingSection={editingSection}
						setEditingSection={setEditingSection}
						onRefresh={handleRefresh}
						isClarifiedUpdate={isClarifiedPending}
						onOpenReportBuilder={() => setPageView("report-builder")}
					/>
				)}
			</PageRowSectionLayout>

			<ActivityPlannerPdfPreview
				open={isPreviewOpen}
				epcData={epcData ?? null}
				createdBy={createdBy}
				onClose={() => setIsPreviewOpen(false)}
			/>
			{isReportPreviewOpen && (
				<EventReportPreview
					open={isReportPreviewOpen}
					description="The dealer meet was conducted successfully with participation from regional partners, customers, and sales teams. Product demonstrations, financing discussions, and lead generation activities were carried out during the event."
					images={dummyImages}
					onClose={() => setReportIsPreviewOpen(false)}
					epcData={epcData ?? null}
				/>
			)}
		</>
	);
};

export default ActivityPlannerPage;
