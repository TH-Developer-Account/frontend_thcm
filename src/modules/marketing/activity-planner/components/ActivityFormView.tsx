import React from "react";
import { useNavigate } from "react-router-dom";

import EpcForm from "../forms/EPC/EpcForm";
import DateRange from "./DateRange";
import ActivityDetailsSection from "./ActivityDetailsSection";
import CrfSection from "../forms/CRF/CrfSection";
import EpfSection from "../forms/EPF/EpfSection";
import CommentsSection from "./CommentsSection";

import type { EpcDetailResponse } from "../types/epc.types";

type EditingSection = "epc" | "crf" | "epf" | null;

type ActivityFormViewProps = {
	epcData?: EpcDetailResponse | null;
	editingSection: EditingSection;
	setEditingSection: React.Dispatch<React.SetStateAction<EditingSection>>;
	onRefresh: () => Promise<void>;
	isClarifiedUpdate?: boolean;
};

const ActivityFormView = ({
	epcData,
	editingSection,
	setEditingSection,
	onRefresh,
	isClarifiedUpdate = false,
}: ActivityFormViewProps) => {
	const navigate = useNavigate();

	if (!epcData) {
		return (
			<div className="content-box w-full h-auto max-w-full mx-auto">
				<div className="px-6 py-4">
					<EpcForm
						mode="create"
						onSuccess={async (savedEpc) => {
							const createdEpcId =
								savedEpc?.id ??
								savedEpc?.eventProposal?.id ??
								savedEpc?.epcId ??
								savedEpc?.epc?.id;

							if (!createdEpcId) {
								console.error("Created EPC id not found", savedEpc);
								return;
							}

							navigate(`/marketing/activity-planner/${createdEpcId}`);
						}}
					/>
				</div>
			</div>
		);
	}

	const activeWorkflow = epcData.activeWorkflow ?? null;
	const workflowStages = activeWorkflow?.stages ?? [];

	return (
		<div className="content-box w-full h-auto max-w-full mx-auto">
			<div className="px-6 py-4">
				<DateRange
					fromDate={epcData.event_from_date}
					toDate={epcData.event_to_date}
				/>

				<div className="form text-left my-3 text-sm">
					<ActivityDetailsSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "epc"}
						onEdit={() => setEditingSection("epc")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<CrfSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "crf"}
						onEdit={() => setEditingSection("crf")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					<EpfSection
						epcData={epcData}
						isClarifiedUpdate={isClarifiedUpdate}
						isEditing={editingSection === "epf"}
						onEdit={() => setEditingSection("epf")}
						onCancel={() => setEditingSection(null)}
						onSuccess={async () => {
							setEditingSection(null);
							await onRefresh();
						}}
					/>

					{epcData.epf && editingSection !== "epf" && (
						<CommentsSection
							epcCreatedById={epcData.created_by_id}
							epcId={epcData.id}
							stages={workflowStages}
							onWorkflowUpdate={onRefresh}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default ActivityFormView;
