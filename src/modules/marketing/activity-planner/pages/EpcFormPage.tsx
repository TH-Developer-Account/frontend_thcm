import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Loader from "../../../../components/ui/Loader";
import EpcForm from "../forms/EPC/EpcForm";
import { useEpcDetailQuery } from "../queries/useEpcDetailQuery";

const EpcFormPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const isEditMode = Boolean(id);

	const { data: epcData, isLoading } = useEpcDetailQuery(id);

	if (isEditMode && isLoading) return <Loader />;

	return (
		<div className="page-stack-layout">
			<PageHeader
				headerText={isEditMode ? "Edit EPC" : "Create EPC"}
				badgeProps={{
					text: "Back",
					direction: "back",
				}}
			/>

			<div className="content-box p-4">
				<EpcForm
					mode={isEditMode ? "edit" : "create"}
					epcId={id}
					initialData={epcData}
					onSuccess={async (savedEpc) => {
						const epcId =
							savedEpc?.id ?? savedEpc?.eventProposal?.id ?? savedEpc?.epc?.id;

						if (epcId) {
							navigate(`/marketing/activity-planner/${epcId}`);
						}
					}}
				/>
			</div>
		</div>
	);
};

export default EpcFormPage;
