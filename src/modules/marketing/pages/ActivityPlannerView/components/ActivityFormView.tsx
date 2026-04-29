import React from "react";
import { ServerAxios } from "../../../../../services/ServerAxios";
import { useEPC } from "../../../context/useEPC";
import BudgetInfo from "./BudgetInfo";
import BudgetShare from "./BudgetShare";
import Participants from "./Participants";
import DateRange from "./DateRange";
import Section from "./Section";
import LineTableView from "./LineTableView";
import Loader from "../../../../../components/ui/Loader";
import type { EpcDetailResponse } from "../types/ActivityView.types";
import CommentsSection, { type CommentUser } from "./CommentsSection";
import { dummyComments } from "../constant/activityFormView.constant";

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
	// const [comments, setComments] = React.useState<CommentItem[]>([]);
	// const [commentsLoading, setCommentsLoading] = React.useState(false);
	// const [commentsError, setCommentsError] = React.useState("");

	const currentUser: CommentUser = {
		id: "1",
		name: "Mon Mon",
		role: "Requester",
	};

	// const loadComments = async () => {
	// 	try {
	// 		setCommentsLoading(true);
	// 		setCommentsError("");

	// 		const { data } = await ServerAxios.get(
	// 			`/comments?module=CRF&referenceId=${crfId}`,
	// 		);

	// 		setComments(data.data);
	// 	} catch {
	// 		setCommentsError("Failed to load comments.");
	// 	} finally {
	// 		setCommentsLoading(false);
	// 	}
	// };

	// const handleCreateComment = async (comment: string) => {
	// 	await ServerAxios.post("/comments", {
	// 		module: "CRF",
	// 		referenceId: crfId,
	// 		parentCommentId: null,
	// 		comment,
	// 	});

	// 	await loadComments();
	// };

	// const handleReplyComment = async (
	// 	parentCommentId: string,
	// 	comment: string,
	// ) => {
	// 	await ServerAxios.post("/comments", {
	// 		module: "CRF",
	// 		referenceId: crfId,
	// 		parentCommentId,
	// 		comment,
	// 	});

	// 	await loadComments();
	// };

	// const handleUpdateComment = async (commentId: string, comment: string) => {
	// 	await ServerAxios.patch(`/comments/${commentId}`, {
	// 		comment,
	// 	});

	// 	await loadComments();
	// };

	// const handleDeleteComment = async (commentId: string) => {
	// 	await ServerAxios.delete(`/comments/${commentId}`);
	// 	await loadComments();
	// };
	const handleCreate = async (text: string) => {
		console.log("CREATE:", text);
	};

	const handleReply = async (parentId: string, text: string) => {
		console.log("REPLY:", parentId, text);
	};

	const handleUpdate = async (id: string, text: string) => {
		console.log("UPDATE:", id, text);
	};

	const handleDelete = async (id: string) => {
		console.log("DELETE:", id);
	};
	if (loading) return <Loader />;
	if (!epcId) return <p>No EPC selected</p>;

	const epc = data.find((item) => String(item.id) === String(epcId));

	if (!epc && !epcData) return <p>EPC not found</p>;

	const viewData = epcData || epc;

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
		<div className=" h-full min-h-screen max-w-5xl">
			<div className="w-full h-auto  mt-0 rounded-smounded-lg px-6 py-4">
				{/* Dates */}
				<DateRange
					fromDate={viewData?.event_from_date}
					toDate={viewData?.event_to_date}
				/>
				<div className="form text-left my-3 text-sm ">
					<Section title="Activity Planner Details">
						<div className="grid grid-cols-4 gap-6 text-sm  p-3">
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
								<span className="uppercase-label-text">Event Scale</span>
								<br />
								{viewData?.event_scale || "--"}
							</div>

							<div>
								<span className="uppercase-label-text">Budget</span>
								<br />
								{budgetValue || "--"}
							</div>
						</div>
					</Section>
					<Section title="Activity Planner Description">
						<div className="mb-6 border-b">
							<div className="flex flex-row justify-between">
								{/* Description */}
								<div className="mt-4 mb-4">
									<p className="text-gray-700 leading-relaxed pl-3">
										{viewData?.event_description || "--"}
									</p>
								</div>

								<div className="mt-4 mb-4">
									<p className="text-gray-700 leading-relaxed pl-3">
										{viewData?.event_objective || "--"}
									</p>
								</div>
							</div>
						</div>
					</Section>
					<Section title="Activity Proposition Form Line Items">
						{viewData?.epf?.lineItems?.length > 0 && (
							<LineTableView data={mapLineItems(viewData?.epf?.lineItems)} />
						)}
					</Section>
					<Section title="Collateral Requisition Form Line Items">
						{viewData?.crf?.lineItems?.length > 0 && (
							<LineTableView data={mapLineItems(viewData?.crf?.lineItems)} />
						)}
					</Section>
					<Section title="Activity Proposition Form Participants">
						<Participants
							internal={viewData?.epf?.internalParticipants}
							external={viewData?.epf?.externalParticipants}
						/>
					</Section>
					<Section title="Activity Proposition Form Budget Information">
						<BudgetInfo
							annualBudget={annualBudget}
							availableBudget={availableBudget}
							eventBudget={viewData?.event}
							allotedBudget={allotedBudget}
						/>
					</Section>
					<Section title="Activity Proposition Form Budget Share">
						<BudgetShare />
					</Section>
					<Section title="Comments">
						<CommentsSection
							comments={dummyComments}
							currentUser={currentUser}
							// loading={commentsLoading}
							// error={commentsError}
							onCreate={handleCreate}
							onReply={handleReply}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
						/>
					</Section>
					<hr className="epf-divider mb-10 pb-12 mt-4 " />
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
