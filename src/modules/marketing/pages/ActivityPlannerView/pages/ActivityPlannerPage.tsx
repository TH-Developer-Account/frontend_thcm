import { useParams } from "react-router-dom";
import ApprovalStatus from "../components/ApprovalStatus";
import ActivityFormView from "../components/ActivityFormView";
import { EPFProvider } from "../../../context/EPCprovider";

const ActivityPlannerPage = () => {
	const { id } = useParams();

	return (
		<div className="grid grid-cols-[220px_1fr] gap-4 items-start">
			<EPFProvider>
				<ApprovalStatus epcId={id} />
				<ActivityFormView epcId={id} />
			</EPFProvider>
		</div>
	);
};

export default ActivityPlannerPage;
