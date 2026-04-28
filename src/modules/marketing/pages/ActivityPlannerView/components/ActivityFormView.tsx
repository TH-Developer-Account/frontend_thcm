import React from "react";
import { ServerAxios } from "../../../../../services/ServerAxios";
import { Badge } from "../../../../../components/common/Badge";
import { statusMap } from "../../../../../utils/types";
import { useEPC } from "../../../context/useEPC";
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

const formatDate = (date?: string) => {
	if (!date) return "--";

	return new Date(date).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const mapLineItems = (items: any[] = []) => {
	return items.map((item, index) => {
		const rate = Number(item.rate || item.amount || 0);
		const qty = Number(item.qty || item.quantity || 0);

		return {
			id: item.id,
			sno: index + 1,
			particulars:
				item.particulars ||
				item.item_name ||
				item.name ||
				item.product?.name || // ✅ FIX HERE
				"--",
			description:
				item.description ||
				item.product?.description || // ✅ FIX HERE
				"--",
			rate,
			qty,
			total: Number(item.total || rate * qty || 0),
		};
	});
};

const ActivityFormView = ({ epcId }: Props) => {
	const { data, loading } = useEPC();
	const [epcData, setEPCData] = React.useState<any>(null);

	const budget = JSON.parse(localStorage.getItem("budgetInfo") || "{}");

	const annualBudget = budget.annualBudget || 0;
	const availableBudget = budget.availableBudget || 0;
	const allotedBudget = budget.allotedBudget || 0;

	React.useEffect(() => {
		if (!epcId) return;

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
	}, [epcId]);

	if (loading) return <Loader />;
	if (!epcId) return <p>No EPC selected</p>;

	const epc = data.find((item) => String(item.id) === String(epcId));

	if (!epc && !epcData) return <p>EPC not found</p>;

	const viewData = epcData || epc;

	const eventName =
		typeof viewData?.event_name === "object"
			? viewData?.event_name?.title
			: viewData?.event_name;

	const branchName =
		typeof viewData?.branch === "object"
			? viewData?.branch?.branch_name
			: viewData?.branch;

	const departmentName =
		typeof viewData?.department === "object"
			? viewData?.department?.department_name
			: viewData?.department;

	const verticalName =
		typeof viewData?.vertical === "object"
			? viewData?.vertical?.name
			: viewData?.vertical;

	const regionName =
		typeof viewData?.region === "object"
			? viewData?.region?.region_name
			: viewData?.region;

	const budgetValue =
		typeof viewData?.budget_master === "object"
			? viewData?.budget_master?.value
			: viewData?.budget_master;

	return (
		<div className=" h-full min-h-screen max-w-4xl">
			<div className="w-full h-auto border shadow-sm border-zinc-300 mt-0 bg-white rounded-smounded-lg px-6 py-4">
				{/* Header */}
				<div className="flex justify-between items-center border-b pb-4">
					<div>
						<h2 className="text-xl font-normal text-left">
							{eventName || "--"}
						</h2>

						<p className="text-sm text-gray-500 text-left">
							{viewData?.proposal_number || "--"} •{" "}
							{`${epc?.first_name || ""} ${epc?.last_name || ""}`.trim() ||
								"--"}{" "}
							• {viewData?.location || "--"}
						</p>
					</div>

					<div>
						<Badge status={statusMap[viewData?.status]}>
							{statusMap[viewData?.status] || viewData?.status}
						</Badge>
					</div>
				</div>

				<hr className="mb-4" />

				<div className="form text-left mb-3 text-sm ">
					{/* Info Grid */}
					{/* <Accordion childrenTitle="EPC Details">
          <APCBasicInfo formData={viewData} /> */}
					<div className="grid grid-cols-2 gap-6 mt-6 text-sm mb-6">
						<div>
							<span className="text-gray-500">Location</span>
							<br />
							{viewData?.location || "--"}
						</div>

						<div>
							<span className="text-gray-500">Branch</span>
							<br />
							{branchName || "--"}
						</div>

						<div>
							<span className="text-gray-500">Department</span>
							<br />
							{departmentName || "--"}
						</div>

						<div>
							<span className="text-gray-500">Vertical</span>
							<br />
							{verticalName || "--"}
						</div>

						<div>
							<span className="text-gray-500">Zone</span>
							<br />
							{regionName || "--"}
						</div>

						<div>
							<span className="text-gray-500">Created</span>
							<br />
							{formatDate(viewData?.created_at)}
						</div>

						<div>
							<span className="text-gray-500">Event Scale</span>
							<br />
							{viewData?.event_scale || "--"}
						</div>

						<div>
							<span className="text-gray-500">Budget</span>
							<br />
							{budgetValue || "--"}
						</div>
					</div>

					<div className="mb-6 border-b">
						{/* Dates */}
						<div className=" mt-6">
							<DateRange
								fromDate={viewData?.event_from_date}
								toDate={viewData?.event_to_date}
							/>
						</div>

						<div className="flex flex-row justify-between">
							{/* Description */}
							<div className="mt-4 mb-4">
								<Section title="Description">
									<p className="text-gray-700 leading-relaxed pl-3">
										{viewData?.event_description || "--"}
									</p>
								</Section>
							</div>

							<div className="mt-4 mb-4">
								<Section title="Objective">
									<p className="text-gray-700 leading-relaxed pl-3">
										{viewData?.event_objective || "--"}
									</p>
								</Section>
							</div>
						</div>
					</div>

					{viewData?.epf?.lineItems?.length > 0 && (
						<LineTableView
							title="EPF Line Items"
							data={mapLineItems(viewData?.epf?.lineItems)}
						/>
					)}

					{viewData?.crf?.lineItems?.length > 0 && (
						<LineTableView
							title="Collateral Requisition"
							data={mapLineItems(viewData?.crf?.lineItems)}
						/>
					)}

					<Participants
						internal={viewData?.epf?.internalParticipants}
						external={viewData?.epf?.externalParticipants}
					/>
					<BudgetInfo
						annualBudget={annualBudget}
						availableBudget={availableBudget}
						eventBudget={viewData?.event}
						allotedBudget={allotedBudget}
					/>
					<BudgetShare />
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
