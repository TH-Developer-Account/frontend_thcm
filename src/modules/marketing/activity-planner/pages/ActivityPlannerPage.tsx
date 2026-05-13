import React from "react";
import { useParams } from "react-router-dom";
import PageRowSectionLayout from "../../../../layout/PageRowSectionLayout";
import Loader from "../../../../components/ui/Loader";
import ActivityFormView from "../components/ActivityFormView";
import ActivityPlannerHeader from "../components/ActivityPlannerHeader";
import ActivityPlannerPdfPreview from "../components/ActivityPlannerPdfPreview";
import { useEpcDetailQuery } from "../queries/useEpcDetailQuery";
import { getEpcCreatedByName } from "../utils/formatters";

const ActivityPlannerPage = () => {
	const { id } = useParams();

	const {
		data: epcData,
		isLoading,
		isFetching,
		refetch,
	} = useEpcDetailQuery(id);

	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
	const [editingSection, setEditingSection] = React.useState<
		"epc" | "crf" | "epf" | null
	>(null);

	const createdBy = getEpcCreatedByName(epcData);

	if (isLoading) return <Loader />;

	return (
		<>
			<PageRowSectionLayout
				header_children={
					<ActivityPlannerHeader
						epcData={epcData}
						createdBy={createdBy}
						loading={isFetching}
						onPreview={() => setIsPreviewOpen(true)}
					/>
				}
			>
				<ActivityFormView
					epcData={epcData}
					editingSection={editingSection}
					setEditingSection={setEditingSection}
					onRefresh={async () => {
						await refetch();
					}}
				/>
			</PageRowSectionLayout>

			<ActivityPlannerPdfPreview
				open={isPreviewOpen}
				epcData={epcData}
				createdBy={createdBy}
				onClose={() => setIsPreviewOpen(false)}
			/>
		</>
	);
};

export default ActivityPlannerPage;
