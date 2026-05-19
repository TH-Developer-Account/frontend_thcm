import React from "react";
import { useParams } from "react-router-dom";

import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import Loader from "../../../../components/ui/Loader";

import ActivityFormView from "../components/ActivityFormView";
import ActivityPlannerHeader from "../components/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/ActivityPlannerPdfPreview";

import { useEpcDetailQuery } from "../queries/useEpcListQuery";
import { useActivityCommentsQuery } from "../queries/useActivityCommentsQuery";
import { getEpcCreatedByName } from "../utils/formatters";
import { useClarifiedResubmission } from "../hooks/useClarifiedResubmission";

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
						createdBy={createdBy}
						loading={isFetching}
						onPreview={() => setIsPreviewOpen(true)}
						isClarifiedPending={isClarifiedPending}
						isSubmittingClarifiedUpdate={isSubmittingClarifiedUpdate}
						onSubmitClarifiedUpdate={submitClarifiedUpdate}
					/>
				}
			>
				<ActivityFormView
					epcData={epcData ?? null}
					editingSection={editingSection}
					setEditingSection={setEditingSection}
					onRefresh={handleRefresh}
					isClarifiedUpdate={isClarifiedPending}
				/>
			</PageRowSectionLayout>

			<ActivityPlannerPdfPreview
				open={isPreviewOpen}
				epcData={epcData ?? null}
				createdBy={createdBy}
				onClose={() => setIsPreviewOpen(false)}
			/>
		</>
	);
};

export default ActivityPlannerPage;
