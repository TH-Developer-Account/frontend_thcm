import React from "react";
import { ServerAxios } from "../../../../../services/ServerAxios";
import BudgetShare from "./BudgetShare";
import DateRange from "./DateRange";
import Section from "./Section";
import LineTableView from "./LineTableView";
import Loader from "../../../../../components/ui/Loader";
import type {
	EpcActiveWorkflow,
	EpcDetailResponse,
} from "../types/ActivityView.types";
import CommentsSection from "./CommentsSection";
import { type ApprovalRow } from "../../../../../components/ui/ApprovalTable";
import { mapBudgetShareInfo } from "./helper";
// import { useAuth } from "../../../../../context/Auth/useAuth";
interface Props {
	epcId?: string;
	epcData?: EpcDetailResponse;
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
		const product = item.product;
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
			// ✅ category mapping fixed
			category: item.category || product?.category || "--",
			rate,
			qty,
			total: Number(item.total || rate * qty || 0),
		};
	});
};

const mapEpcWorkflowToApprovalRows = (
	workflow?: EpcActiveWorkflow | null,
): ApprovalRow[] => {
	if (!workflow) return [];

	return workflow.stages.flatMap((stage) =>
		stage.approvals.map((approval) => ({
			id: stage.stageOrder,
			name: `${approval.approver.first_name} ${approval.approver.last_name}`,
			email: approval.approver.email ?? "-",
			stageName: `Stage ${stage.stageOrder}`,
			strategy: stage.strategy,
			status: approval.status,
		})),
	);
};

const ActivityFormView = ({ epcId }: Props) => {
	const [epcData, setEPCData] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (epcId) fetchEPC();
	}, [epcId]);

	const fetchEPC = async () => {
		try {
			setLoading(true);
			const {
				data: { data },
			} = await ServerAxios.get(`/epc/${epcId}`);

			setEPCData(data);
		} catch (err) {
			console.log({ err });
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <Loader />;
	if (!epcId) return <p>No EPC selected</p>;

	if (!epcData) return <p>EPC not found</p>;

	const epf = epcData?.epf;

	const viewData = epcData;
	const { items: budgetItems, shareInfo } = mapBudgetShareInfo({
		eventBudget: epf?.eventBudget,
		annualBudget: epf?.annualBudget,
		availableBudget: epf?.availableBudget,
		allotedBudget: epf?.allotedBudget,

		dealerName: epf?.dealerName,
		tataHitachiPoAmount: epf?.tataHitachiPoAmount,
		dealerPercent: epf?.dealerPercent,
	});

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

	const approvalRows = mapEpcWorkflowToApprovalRows(epcData?.activeWorkflow);
	const total =
		(Number(viewData?.epf?.internalParticipants) || 0) +
		(Number(viewData?.epf?.externalParticipants) || 0);

	return (
		<div className="content-box w-full h-auto max-w-full mx-auto">
			<div className="px-6 py-4">
				{/* Dates */}
				<DateRange
					fromDate={viewData?.event_from_date}
					toDate={viewData?.event_to_date}
				/>
				<div className="form text-left my-3 text-sm ">
					<Section title="Activity Planner Details">
						<div className="grid grid-cols-5 gap-6 text-xs p-3">
							<div>
								<span className="uppercase-label-text">Location</span>
								<br />
								{viewData?.location || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Branch</span>
								<br />
								{branchName || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Department</span>
								<br />
								{departmentName || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Vertical</span>
								<br />
								{verticalName || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Zone</span>
								<br />
								{regionName || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Created</span>
								<br />
								{formatDate(viewData?.created_at)}
							</div>

							<div>
								<span className="uppercase-label-text">Budget</span>
								<br />
								{budgetValue || "--"}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-6 text-sm p-3">
							{/* Description */}
							<div>
								<span className="uppercase-label-text">Description</span>
								<p className="text-gray-700 leading-relaxed text-xs">
									{viewData?.event_description || "No Description"}
								</p>
							</div>

							<div>
								<span className="uppercase-label-text">Objective</span>
								<p className="text-gray-700 leading-relaxed text-xs">
									{viewData?.event_objective || "No Objective"}
								</p>
							</div>
						</div>
					</Section>
					<Section title="Participants">
						<div className="grid grid-cols-4 gap-6 text-sm px-4 py-1.5">
							<p className="uppercase-label-text">
								Internal :{" "}
								<span className="text-gray-700 leading-relaxed text-xs">
									{viewData?.epf?.internalParticipants}
								</span>
							</p>
							<p className="uppercase-label-text">
								External :
								<span className="text-gray-700 leading-relaxed text-xs">
									{viewData?.epf?.externalParticipants}
								</span>
							</p>
							<p className="uppercase-label-text">
								Total :{" "}
								<span className="text-gray-700 leading-relaxed text-xs">
									{total}
								</span>
							</p>
						</div>
					</Section>
					{viewData?.crf?.lineItems?.length > 0 && (
						<Section title="Collateral Requisition Form Line Items">
							<LineTableView data={mapLineItems(viewData?.crf?.lineItems)} />
						</Section>
					)}
					{viewData?.epf?.lineItems?.length > 0 && (
						<Section title="Event Cost Overheads">
							<LineTableView data={mapLineItems(viewData?.epf?.lineItems)} />
						</Section>
					)}
					{viewData?.epf && (
						<Section title="Activity Proposition Form Budget Information">
							<BudgetShare items={budgetItems} shareInfo={shareInfo} />
						</Section>
					)}
					{viewData?.epf && (
						<Section title="Comments">
							<CommentsSection
								workFlowId={epcData.activeWorkflow.id}
								stages={epcData.activeWorkflow.stages}
								approvalRows={approvalRows}
								onWorkflowUpdate={fetchEPC}
							/>
						</Section>
					)}
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
