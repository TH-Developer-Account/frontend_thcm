import React from "react";
import { useParams } from "react-router-dom";

import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import Loader from "../../../../components/ui/Loader";

import ActivityFormView from "../components/activityFormView/ActivityFormView";
import ActivityPlannerHeader from "../components/activityFormView/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/activityFormView/ActivityPlannerPdfPreview";

import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import {
	useActivityCommentsQuery,
	useValidateEventReportMutation,
	useEventReportQuery,
} from "../queries/useActivityFormQuery";
import { getEpcCreatedByName } from "../utils/formatters";
import { useClarifiedResubmission } from "../hooks/useClarifiedResubmission";
import EventReportTemplate from "../forms/EventReport/EventReportTemplate";
import EventReportPreview from "../forms/EventReport/EventReportPreview";
import { useAuth } from "../../../../context/Auth/useAuth";

type PageView = "form" | "report-builder" | "report-view";

const ActivityPlannerPage = () => {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();

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

	const reportQuery = useEventReportQuery(
		id,
		Boolean(id) &&
			Boolean(
				epcData?.status &&
				["CONDUCTED", "CLARIFY_REPORT", "REPORT_SUBMITTED"].includes(
					epcData.status,
				),
			),
	);
	const reportData = reportQuery.data ?? epcData?.report ?? null;
	const isProposer = epcData?.created_by_id === user?.id;
	const createdBy = getEpcCreatedByName(epcData ?? null);
	const isValidator = reportData?.validatorId === user?.id;
	const ProposeName = isProposer
		? `${user?.first_name} ${user?.last_name}`
		: "--";
	console.log("isProposer", isProposer);
	const [hasValidatorPreviewed, setHasValidatorPreviewed] =
		React.useState(false);

	const validateReportMutation = useValidateEventReportMutation();

	const handleRefresh = async () => {
		await refetch();
	};

	const handleOpenReportPreview = () => {
		setReportIsPreviewOpen(true);

		if (isValidator) {
			setHasValidatorPreviewed(true);
		}
	};

	const handleValidateReport = async () => {
		if (!reportData?.id || !epcData?.id) return;

		await validateReportMutation.mutateAsync({
			reportId: reportData.id,
		});

		setHasValidatorPreviewed(false);
		await handleRefresh();
		await reportQuery.refetch();
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
						createdBy={ProposeName}
						onPreview={() => setIsPreviewOpen(true)}
					/>
				}
			>
				{pageView === "report-builder" ? (
					<EventReportTemplate
						epcId={id!}
						eventCost={epcData?.epf?.eventBudget || 0}
						initialReport={reportData}
						onBack={() => setPageView("form")}
						onPreview={handleOpenReportPreview}
						onSuccess={async () => {
							setPageView("form");
							await handleRefresh();
							await reportQuery.refetch();
						}}
					/>
				) : (
					<ActivityFormView
						epcData={epcData ?? null}
						loading={isFetching}
						editingSection={editingSection}
						setEditingSection={setEditingSection}
						onRefresh={handleRefresh}
						isClarifiedUpdate={isClarifiedPending}
						report={reportData}
						isProposer={Boolean(isProposer)}
						isValidator={Boolean(isValidator)}
						hasValidatorPreviewed={hasValidatorPreviewed}
						isValidatingReport={validateReportMutation.isPending}
						onOpenReportBuilder={() => setPageView("report-builder")}
						onOpenReportPreview={handleOpenReportPreview}
						onValidateReport={handleValidateReport}
						isClarifiedPending={isClarifiedPending}
						isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
						onSubmitClarifiedUpdate={submitClarifiedUpdate}
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
