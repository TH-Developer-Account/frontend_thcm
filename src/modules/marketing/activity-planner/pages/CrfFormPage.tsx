import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Loader from "../../../../components/ui/Loader";
import CrfForm from "../forms/CRF/CrfForm";
import { useEpcDetailQuery } from "../queries/useEpcDetailQuery";

const CrfFormPage = () => {
	const { epcId } = useParams();
	const navigate = useNavigate();

	const { data: epcData, isLoading } = useEpcDetailQuery(epcId);

	if (isLoading) return <Loader />;

	return (
		<div className="page-stack-layout">
			<PageHeader
				headerText={epcData?.crf ? "Edit CRF" : "Create CRF"}
				badgeProps={{
					text: "Back",
					direction: "back",
				}}
			/>

			<div className="content-box p-4">
				<CrfForm
					mode={epcData?.crf ? "edit" : "create"}
					epcId={epcId}
					crfId={epcData?.crf?.id}
					initialData={epcData?.crf}
					onSuccess={async () => {
						navigate(`/marketing/activity-planner/${epcId}`);
					}}
				/>
			</div>
		</div>
	);
};

export default CrfFormPage;
