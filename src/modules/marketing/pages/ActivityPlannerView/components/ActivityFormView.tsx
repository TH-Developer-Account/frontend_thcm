import { Badge } from "../../../../../components/common/Badge";
import { statusMap } from "../../../../../utils/types";
import { useEPC } from "../../../context/useEPC";
import ApprovalCardsView from "./ApprovalCardsView";
import BudgetInfo from "./BudgetInfo";
import BudgetShare from "./BudgetShare";
import Participants from "./Participants";
import DateRange from "./DateRange";
import Section from "./Section";
import LineTableView from "./LineTableView";
import Loader from "../../../../../components/ui/Loader";

interface Props {
	epcId?: string;
}

const tableData = [
	{
		sno: 1,
		particulars: "Beverages",
		description: "Soft Drinks (Energy Drinks)",
		rate: 10,
		qty: 50,
		total: 500,
	},
	{
		sno: 2,
		particulars: "Snacks",
		description: "Sandwiches (All Vegetarian Sandwiches)",
		rate: 145,
		qty: 50,
		total: 7250,
	},
];

const ActivityFormView = ({ epcId }: Props) => {
	const { data, loading } = useEPC();

	if (loading) return <Loader />;
	if (!epcId) return <p>No EPC selected</p>;

	const epc = data.find(
		(item) => String(item.proposal_number) === String(epcId),
	);

	if (!epc) return <p>EPC not found</p>;

	return (
		<div className="bg-white rounded-xl h-full min-h-screen max-w-4xl">
			<div className="w-full h-auto border shadow-sm border-zinc-300 mt-6 rounded-lg px-6 py-4">
				{/* Header */}
				<div className="flex justify-between items-center border-b pb-4">
					<div>
						<h2 className="text-xl font-normal text-left">{epc.event_name}</h2>
						<p className="text-sm text-gray-500 text-left">
							EPF-5506 • Marketing • Bangalore
						</p>
					</div>
					<div>
						{/* <p className="text-gray-700  text-sm pl-3">
							{epc.first_name + ", " + epc.last_name}
						</p> */}
						<Badge status={statusMap[epc.status]}>
							{statusMap[epc.status]}
						</Badge>
					</div>
				</div>
				<hr className="mb-4" />
				<div className="form text-left mb-3 text-sm ">
					{/* Info Grid */}
					<div className="grid grid-cols-2 gap-6 mt-6 text-sm mb-6">
						<div>
							<span className="text-gray-500">Location</span>
							<br />
							{epc.location}
						</div>
						<div>
							<span className="text-gray-500">Branch</span>
							<br />
							Bangalore
						</div>
						<div>
							<span className="text-gray-500">Department</span>
							<br />
							Marketing
						</div>
						<div>
							<span className="text-gray-500">Vertical</span>
							<br />
							Marketing
						</div>
						<div>
							<span className="text-gray-500">Zone</span>
							<br />
							South 1
						</div>
						<div>
							<span className="text-gray-500">Created</span>
							<br />
							12 Feb 2027
						</div>
					</div>
					<div className="mb-6 border-b">
						{/* Dates */}
						<div className=" mt-6">
							<DateRange />
						</div>

						{/* Description */}
						<div className="mt-6 mb-4">
							<Section title="Description">
								<p className="text-gray-700 leading-relaxed pl-3">
									{epc.event_description}
								</p>
							</Section>
						</div>
					</div>
					<div className="tables border-b mb-6">
						<LineTableView title="Event Cost Overheads" data={tableData} />
						<hr className="mb-6" />
						<LineTableView title="Collateral Requisition" data={tableData} />
					</div>
					<Participants />
					<BudgetInfo />
					<BudgetShare />
					<ApprovalCardsView
						epcId={epcId}
						firstName={epc.first_name}
						lastName={epc.last_name}
					/>
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
