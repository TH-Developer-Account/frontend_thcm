import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Loader from "../../../../components/ui/Loader";
import EpfForm from "../forms/EPF/EpfForm";
import { useEpcDetailQuery } from "../queries/useEpcDetailQuery";

const EpfFormPage = () => {
	const { epcId } = useParams();
	const navigate = useNavigate();

	const { data: epcData, isLoading } = useEpcDetailQuery(epcId);

	if (isLoading) return <Loader />;

	return (
		<div className="page-stack-layout">
			<PageHeader
				headerText={epcData?.epf ? "Edit EPF" : "Create EPF"}
				badgeProps={{
					text: "Back",
					direction: "back",
				}}
			/>

			<div className="content-box p-4">
				<EpfForm
					mode={epcData?.epf ? "edit" : "create"}
					variant="page"
					epcId={epcId}
					crfId={epcData?.crf?.id}
					epfId={epcData?.epf?.id}
					initialData={epcData?.epf}
					crfData={epcData?.crf}
					onSuccess={async () => {
						navigate(`/marketing/activity-planner/${epcId}`);
					}}
				/>
			</div>
		</div>
	);
};

export default EpfFormPage;
