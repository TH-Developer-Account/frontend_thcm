import { Badge } from "../../../../../components/common/Badge";
import { statusMap } from "../../../../../utils/types";
import { useEPC } from "../../../context/useEPC";
import BudgetShare from "./BudgetShare";

interface Props {
	epcId?: string;
}

const ActivityFormView = ({ epcId }: Props) => {
	const { data, loading } = useEPC();

	if (loading) return <p>Loading...</p>;
	if (!epcId) return <p>No EPC selected</p>;

	const epc = data.find(
		(item) => String(item.proposal_number) === String(epcId),
	);

	if (!epc) return <p>EPC not found</p>;

	return (
		<div className="bg-white rounded-xl h-full min-h-screen max-w-4xl">
			<div className="w-full h-auto  border shadow-sm border-zinc-300 mt-6 rounded-lg px-6 py-3">
				<div className=" mb-4">
					<div className="font-semibold text-xl flex gap-2 justify-center items-center ">
						{/* <span className="text-md font-medium italic">Activity:</span>{" "} */}
						<p className="text-xl">{epc.event_name}</p>
					</div>
				</div>
				<hr className="mb-4" />
				<div className="form text-left mb-3 text-sm ">
					<div className="row-1  justify-between flex items-center mb-8">
						<p className="font-bold">
							EPF No :{" "}
							<span className="font-medium">{epc.proposal_number}</span>
						</p>
						{/* <p className=" font-bold">{epc.event_name}</p> */}

						<p className=" font-bold">
							Activity Status :{" "}
							<span className="font-medium">
								<Badge status={statusMap[epc.status]}>
									{statusMap[epc.status]}
								</Badge>
							</span>
						</p>
					</div>
					<div className="row-2  justify-between flex items-center mb-8">
						<p className="font-bold ">
							Location : <span className="font-light">{epc.location}</span>
						</p>
						<p className="font-bold">
							Created Date :
							<span className="font-light ml-2">{"12/02/2027"}</span>
						</p>
					</div>
					<div className="row-3  justify-between flex items-center mb-8 ">
						<div className="">
							<p className="font-bold mb-2">
								Department : <span className="font-light">Marketing</span>
							</p>
							<p className="font-bold">
								Zone :<span className="font-light ml-2">South 1</span>
							</p>
						</div>
						<div>
							<p className="font-bold mb-2">
								Branch : <span className="font-light">Bangalore</span>
							</p>
							<p className="font-bold">
								Vertical :<span className="font-light ml-2">Marketing</span>
							</p>
						</div>
					</div>
					<div className="row-4 mb-8">
						<p className="font-bold mb-2">
							From Date : <span className="font-light">12/03/2027</span>
						</p>
						<p className="font-bold">
							To Date :<span className="font-light ml-2">14/03/2027</span>
						</p>
					</div>
					<div className="row-5  justify-start flex items-center gap-2 mb-8">
						<p className="font-bold">Activity Description : </p>
						<span className="font-light">{epc.event_description}</span>
					</div>
					<hr className="mb-4" />
					<div className="row-6  text-center mb-4">
						<p className=" font-semibold text-md">Event Cost Overheads </p>
						<div className=" mt-4 w-full text-left px-3 py-1.5">
							<div className="grid grid-cols-12 text-sm font-medium items-center justify-between text-gray-600 mb-3 bg-zinc-100 py-1.5 px-2 rounded-sm">
								<div className="col-span-1">SNo</div>
								<div className="col-span-2">Particulars</div>
								<div className="col-span-5">Description</div>
								<div className="col-span-1 text-right">Rate</div>
								<div className="col-span-1 text-right">Qty</div>
								<div className="col-span-2 text-right">Total</div>
							</div>
							<div className="grid grid-cols-12 gap-3 mb-2  py-1.5 px-2">
								<div className="col-span-1 text-gray-500">1.</div>
								<div className="col-span-2">Beverages</div>
								<div className="col-span-5">Soft Drinks (Energy Drinks)</div>
								<div className="col-span-1 text-right">10.00</div>
								<div className="col-span-1 text-right">50</div>
								<div className="col-span-2 text-right">500.00</div>
							</div>
							<div className="grid grid-cols-12 gap-3 mb-2   py-1.5 px-2">
								<div className="col-span-1 text-gray-500">2.</div>
								<div className="col-span-2">Snacks</div>
								<div className="col-span-5">
									Sandwiches (All Vegetarian Sandwiches)
								</div>
								<div className="col-span-1 text-right">145.00</div>
								<div className="col-span-1 text-right">50</div>
								<div className="col-span-2 text-right">7250.00</div>
							</div>
						</div>
					</div>
					<hr className="mb-4" />
					<div className="row-7 justify-between flex items-center mb-8">
						<p className="font-bold ">
							Internal Participants : <span className="font-light">50</span>
						</p>
						<p className="font-bold ">
							External Participants :<span className="font-light ml-2">50</span>
						</p>
						<p className="font-bold ">
							Total Participants : <span className="font-light">100</span>
						</p>
					</div>
					<div className="row-7 justify-between flex items-center mb-4">
						<p className="font-bold ">
							Budget Code : <span className="font-light">BUD23SAL</span>
						</p>
						<p className="font-bold ">
							Annual Budget : <span className="font-light">9,00,000.00</span>
						</p>
						<p className="font-bold ">
							Available Budget :<span className="font-light ml-2">95,000</span>
						</p>
					</div>
					<div className="row-7 justify-between flex items-center mb-10">
						<p className="font-bold ">
							Budget Description : <span className="font-light">Demo Show</span>
						</p>
						<p className="font-bold ">
							Event Budget : <span className="font-light">83,000.00</span>
						</p>
					</div>
					<div className="row-7 justify-between flex items-center mb-8">
						<p className="font-bold ">
							Dealer Name :{" "}
							<span className="font-light">Recon Technologies Pvt Ltd.</span>
						</p>
						<p className="font-bold ">
							Tata Hitachi's PO Amount :{" "}
							<span className="font-light">1,00,000.00</span>
						</p>
					</div>
					<BudgetShare />
					<div className="row-7 justify-between flex items-center mb-8">
						<div>
							<p className="font-bold mb-2">
								Proposer :{" "}
								<span className="font-light">
									{epc.first_name + ", " + epc.last_name}
								</span>
							</p>
							<p className="font-bold ">
								Status :{" "}
								<span className="font-medium">
									<Badge status={statusMap[epc.status]}>
										{statusMap[epc.status]}
									</Badge>
								</span>
							</p>
						</div>
						<div>
							<p className="font-bold mb-2">
								Checker :{" "}
								<span className="font-light">
									{epc.first_name + ", " + epc.last_name}
								</span>
							</p>
							<p className="font-bold ">
								Status :{" "}
								<span className="font-medium">
									<Badge status={statusMap[epc.status]}>
										{statusMap[epc.status]}
									</Badge>
								</span>
							</p>
						</div>
						<div>
							<p className="font-bold mb-2">
								Approver :{" "}
								<span className="font-light">
									{epc.first_name + ", " + epc.last_name}
								</span>
							</p>
							<p className="font-bold ">
								Status :{" "}
								<span className="font-medium">
									<Badge status={statusMap[epc.status]}>
										{statusMap[epc.status]}
									</Badge>
								</span>
							</p>
						</div>
						<div>
							<p className="font-bold mb-2">
								Validater :{" "}
								<span className="font-light">
									{epc.first_name + ", " + epc.last_name}
								</span>
							</p>
							<p className="font-bold ">
								Status :{" "}
								<span className="font-medium">
									<Badge status={statusMap[epc.status]}>
										{statusMap[epc.status]}
									</Badge>
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
