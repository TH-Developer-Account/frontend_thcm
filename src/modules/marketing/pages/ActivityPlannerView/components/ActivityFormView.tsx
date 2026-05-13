import React from "react";
import { ServerAxios } from "../../../../../services/ServerAxios";
import BudgetShare from "./BudgetShare";
import DateRange from "./DateRange";
import Section from "./Section";
import LineTableView from "./LineTableView";
import Loader from "../../../../../components/ui/Loader";
import type { EpcDetailResponse } from "../types/ActivityView.types";
import CommentsSection from "./CommentsSection";
import { mapBudgetShareInfo } from "./helper";
import { formatDate } from "../../../../../utils/format";
import Button from "../../../../../components/common/Button";
import { Pencil, Plus, Send } from "lucide-react";
import CrfForm from "../../CRFScreen/CrfForm";
import EpcForm from "../../EPCScreen/EpcForm";
import EpfForm from "../../EPFScreen/EpfForm";
import { useNavigate } from "react-router-dom";
import { mapLineItems } from "../activityFormViewMappers";
import { isClarificationModeForEpc } from "../helpers/activityFormView.helper";

type EditingSection = "epc" | "crf" | "epf" | null;

interface Props {
	epcId?: string;
	epcData?: EpcDetailResponse;
	mode?: "create" | "view";
}

const ActivityFormView = ({ epcId }: Props) => {
	const [epcData, setEPCData] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);
	const [editingSection, setEditingSection] =
		React.useState<EditingSection>(null);

	const [hasPendingClarificationChanges, setHasPendingClarificationChanges] =
		React.useState(false);

	const [finalSubmitLoading, setFinalSubmitLoading] = React.useState(false);

	const navigate = useNavigate();

	const fetchEPC = React.useCallback(async () => {
		if (!epcId) return;

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
	}, [epcId]);

	React.useEffect(() => {
		fetchEPC();
	}, [fetchEPC]);

	const markClarificationChange = React.useCallback(() => {
		if (isClarificationModeForEpc(epcData)) {
			setHasPendingClarificationChanges(true);
		}
	}, [epcData]);

	const handleFinalSubmit = async () => {
		if (!epcData?.id) return;
		console.log("--->", true);
		try {
			setFinalSubmitLoading(true);

			await ServerAxios.post(`/epc/${epcData.id}/resubmit-clarification`, {
				resubmitAfterClarification: true,
			});

			setHasPendingClarificationChanges(false);
			setEditingSection(null);

			await fetchEPC();
		} catch (err) {
			console.log({ err });
		} finally {
			setFinalSubmitLoading(false);
		}
	};

	if (loading) return <Loader />;

	if (!epcId) {
		return (
			<div className="content-box w-full h-auto max-w-full mx-auto">
				<div className="px-6 py-4">
					<EpcForm
						mode="create"
						variant="inline"
						onSuccess={async (createdEpc) => {
							const createdEpcId =
								createdEpc?.id ??
								createdEpc?.eventProposal?.id ??
								createdEpc?.epc?.id;

							if (!createdEpcId) {
								console.error("Created EPC id not found", createdEpc);
								return;
							}

							navigate(`/marketing/activity-planner/${createdEpcId}`);
						}}
					/>
				</div>
			</div>
		);
	}

	if (!epcData) return <p>EPC not found</p>;

	const viewData = epcData;
	const epf = viewData?.epf;
	const crf = viewData?.crf;

	const isClarificationMode = isClarificationModeForEpc(viewData);

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

	const total =
		(Number(viewData?.epf?.internalParticipants) || 0) +
		(Number(viewData?.epf?.externalParticipants) || 0);

	const activeWorkflow = viewData?.activeWorkflow ?? null;
	const workflowStages = activeWorkflow?.stages ?? [];

	return (
		<div className="content-box w-full h-auto max-w-full mx-auto">
			<div className="px-6 py-4">
				<DateRange
					fromDate={viewData?.event_from_date}
					toDate={viewData?.event_to_date}
				/>

				{isClarificationMode && (
					<div className="mb-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<p className="text-sm font-semibold text-orange-900">
									Clarification requested
								</p>
								<p className="text-xs text-orange-800">
									Update EPC, CRF, or EPF individually. After all corrections
									are done, click Save & Final Submit to send it back for
									approval.
								</p>
							</div>

							<Button
								type="button"
								text={
									finalSubmitLoading ? "Submitting..." : "Save & Final Submit"
								}
								Icon={Send}
								iconColor="white"
								size="sm"
								disabled={!hasPendingClarificationChanges || finalSubmitLoading}
								onClick={handleFinalSubmit}
							/>
						</div>
					</div>
				)}

				<div className="form text-left my-3 text-sm">
					{editingSection === "epc" ? (
						<EpcForm
							mode="edit"
							variant="inline"
							epcId={viewData?.id}
							initialData={viewData}
							onCancel={() => setEditingSection(null)}
							onSuccess={async () => {
								setEditingSection(null);
								markClarificationChange();
								await fetchEPC();
							}}
						/>
					) : (
						<Section
							title="Activity Planner Details"
							action={
								<Button
									type="button"
									Icon={Pencil}
									size="sm"
									iconColor="red"
									onClick={() => setEditingSection("epc")}
								/>
							}
						>
							<div className="grid grid-cols-7 items-center justify-between gap-6 text-xs p-3">
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
								<div>
									<span className="uppercase-label-text">Description</span>
									<p className="text-black leading-relaxed text-xs">
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
					)}

					{editingSection === "crf" ? (
						<CrfForm
							mode={crf ? "edit" : "create"}
							epcId={viewData?.id}
							crfId={crf?.id}
							initialData={crf}
							onCancel={() => setEditingSection(null)}
							onSuccess={async () => {
								setEditingSection(null);
								markClarificationChange();
								await fetchEPC();
							}}
						/>
					) : crf?.lineItems?.length > 0 ? (
						<Section
							title="Collateral Requisition Form Line Items"
							action={
								<Button
									type="button"
									iconPosition="right"
									Icon={Pencil}
									iconColor="red"
									size="sm"
									onClick={() => setEditingSection("crf")}
								/>
							}
						>
							<LineTableView data={mapLineItems(crf?.lineItems)} />
						</Section>
					) : (
						<Section
							title="Collateral Requisition Form"
							action={
								<Button
									type="button"
									text="Create CRF"
									Icon={Plus}
									iconColor="red"
									size="sm"
									className="epf-section-label text-xs"
									onClick={() => setEditingSection("crf")}
								/>
							}
						>
							<div className="text-sm text-gray-500">
								No CRF has been created for this EPC yet.
							</div>
						</Section>
					)}

					{editingSection === "epf" ? (
						<EpfForm
							mode={epf ? "edit" : "create"}
							variant="inline"
							epcId={viewData?.id}
							crfId={crf?.id}
							epfId={epf?.id}
							initialData={epf}
							crfData={crf}
							onCancel={() => setEditingSection(null)}
							onSuccess={async () => {
								setEditingSection(null);
								markClarificationChange();
								await fetchEPC();
							}}
						/>
					) : epf ? (
						<>
							<Section
								title="Event Cost Overheads"
								action={
									<Button
										type="button"
										Icon={Pencil}
										iconColor="red"
										onClick={() => setEditingSection("epf")}
										size="sm"
									/>
								}
							>
								{epf?.lineItems?.length > 0 ? (
									<LineTableView data={mapLineItems(epf?.lineItems)} />
								) : (
									<div className="text-xs text-gray-500">
										No event cost overheads added.
									</div>
								)}
							</Section>

							<Section title="Activity Proposition Form Budget Information">
								{epf?.internalParticipants || epf?.externalParticipants ? (
									<div className="grid grid-cols-4 gap-6 my-2 text-sm px-4 py-1.5">
										<p className="uppercase-label-text">
											Internal:{" "}
											<span className="text-gray-700 leading-relaxed text-xs">
												{epf?.internalParticipants || 0}
											</span>
										</p>

										<p className="uppercase-label-text">
											External:{" "}
											<span className="text-gray-700 leading-relaxed text-xs">
												{epf?.externalParticipants || 0}
											</span>
										</p>

										<p className="uppercase-label-text">
											Total:{" "}
											<span className="text-gray-700 leading-relaxed text-xs">
												{total}
											</span>
										</p>
									</div>
								) : null}

								<BudgetShare items={budgetItems} shareInfo={shareInfo} />
							</Section>
						</>
					) : (
						<Section
							title="Activity Proposition Form"
							action={
								<Button
									type="button"
									text="Create EPF"
									Icon={Plus}
									iconColor="red"
									onClick={() => setEditingSection("epf")}
									size="sm"
									className="epf-section-label text-xs"
								/>
							}
						>
							<div className="text-xs text-gray-500">
								No EPF has been created for this EPC yet.
							</div>
						</Section>
					)}

					{viewData?.epf && editingSection !== "epf" && (
						<CommentsSection
							epcCreatedById={viewData.created_by_id}
							epcId={viewData.id}
							stages={workflowStages}
							onWorkflowUpdate={fetchEPC}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
