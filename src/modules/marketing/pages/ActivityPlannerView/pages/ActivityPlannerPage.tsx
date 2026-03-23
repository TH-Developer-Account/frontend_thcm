import { useParams } from "react-router-dom";
import ApprovalStatus from "../components/ApprovalStatus";
import ActivityFormView from "../components/ActivityFormView";
import { EPFProvider } from "../../../context/EPCprovider";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ActivityPlannerPage = () => {
	const { id } = useParams();

	const navigate = useNavigate();
	return (
		<div>
			<div className="flex items-center gap-4  mt-2">
				<button
					onClick={() => navigate(-1)}
					className="w-8 h-8 rounded-lg bg-gray-50 border border-zinc-800 flex items-center justify-center"
				>
					<ArrowLeft />
				</button>

				<h2 className="text-xl font-normal text-left">Form View</h2>
			</div>

			<div className="grid grid-cols-[220px_1fr] gap-4 items-start">
				<EPFProvider>
					<ApprovalStatus epcId={id} />
					<ActivityFormView epcId={id} />
				</EPFProvider>
			</div>
		</div>
	);
};

export default ActivityPlannerPage;
