import React from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ApprovalStatus from "../components/ApprovalStatus";
import ActivityFormView from "../components/ActivityFormView";
import { EPCProvider } from "../../../context/EPCprovider";
import { useNavigate } from "react-router-dom";
import { ServerAxios } from "../../../../../services/ServerAxios";

const ActivityPlannerPage = () => {
	const { id } = useParams();
	const stored = localStorage.getItem("epcInfo");
	let epcId: string | null = null;
	if (stored) {
		const parsed = JSON.parse(stored);
		epcId = parsed.epcId || null;
	}
	const navigate = useNavigate();
	const [epcData, setEPCData] = React.useState();

	React.useEffect(() => {
		const load = async () => {
			try {
				const {
					data: { data },
				} = await ServerAxios.get(`/epc/${epcId}`);
				setEPCData(data);
			} catch (err) {
				console.log({ err });
			}
		};

		load();
	}, []);
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
				<EPCProvider>
					<ApprovalStatus epcData={epcData} />
					<ActivityFormView epcId={id} />
				</EPCProvider>
			</div>
		</div>
	);
};

export default ActivityPlannerPage;
