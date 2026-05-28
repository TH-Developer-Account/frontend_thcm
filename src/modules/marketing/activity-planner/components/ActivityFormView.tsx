import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import EpcForm from "../forms/EPC/EpcForm";
import ActivityDetailsSection from "./ActivityDetailsSection";
import CrfSection from "../forms/CRF/CrfSection";
import EpfSection from "../forms/EPF/EpfSection";
import CommentsSection from "./CommentsSection";

import type { EpcDetailResponse } from "../types/epc.types";
import { EventOutcome } from "./EventOutcome";
import { EventReportSection } from "./EventReport/EventReportSection";
import Button from "../../../../components/common/Button";

type EditingSection = "epc" | "crf" | "epf" | null;

type ActivityFormViewProps = {
	epcData?: EpcDetailResponse | null;
	editingSection: EditingSection;
	setEditingSection: React.Dispatch<React.SetStateAction<EditingSection>>;
	onRefresh: () => Promise<void>;
	isClarifiedUpdate?: boolean;
	loading?: boolean;
	onPreview: () => void;
	onOpenReportBuilder: () => void;
};

const ActivityFormView = ({
	epcData,
	editingSection,
	setEditingSection,
	onRefresh,
	loading,
	onOpenReportBuilder,
	onPreview,
	isClarifiedUpdate = false,
}: ActivityFormViewProps) => {
	const navigate = useNavigate();

	if (!epcData) {
		return (
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
		);
	}

	const activeWorkflow = epcData.activeWorkflow ?? null;
	const workflowStages = activeWorkflow?.stages ?? [];
	const eventStatus = epcData.status ?? "unknown";

	return (
		<>
			<div className="px-6 py-4">
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
					{eventStatus === "APPROVED" && (
						<EventOutcome eventStatus={eventStatus} epcID={epcData?.id} />
					)}
					{eventStatus === "CONDUCTED" && (
						<EventReportSection
							eventStatus={eventStatus}
							epcID={epcData?.id}
							onOpenReportBuilder={onOpenReportBuilder}
						/>
					)}
				</div>
			</div>
			{/* Footer Actions */}
			<div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-4">
				<div className="flex gap-2">
					<Button
						type="button"
						text={"Preview"}
						Icon={Eye}
						iconPosition="right"
						onClick={onPreview}
						status="outline"
						disabled={!epcData || loading}
					/>
					<Button status="outline">Download</Button>
				</div>
			</div>
		</>
	);
};

export default ActivityFormView;
