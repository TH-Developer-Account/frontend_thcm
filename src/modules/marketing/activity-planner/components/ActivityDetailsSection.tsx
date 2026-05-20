import { Pencil } from "lucide-react";
import Button from "../../../../components/common/Button";
import Section from "./Section";
import EpcForm from "../forms/EPC/EpcForm";
import type { EpcDetailResponse } from "../types/epc.types";
import { formatDate, trimText } from "../../../../utils/format";
import {
	getEpcBranchName,
	getEpcBudgetValue,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../utils/formatters";

type ActivityDetailsSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	isClarifiedUpdate?: boolean;
};

const ActivityDetailsSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
	isClarifiedUpdate,
}: ActivityDetailsSectionProps) => {
	if (isEditing) {
		return (
			<EpcForm
				mode="edit"
				epcId={epcData.id}
				initialData={epcData}
				onCancel={onCancel}
				onSuccess={onSuccess}
				isClarifiedUpdate={isClarifiedUpdate}
			/>
		);
	}

	return (
		<Section
			title="Activity Planner Details"
			action={
				<Button
					type="button"
					Icon={Pencil}
					size="sm"
					iconColor="red"
					onClick={onEdit}
				/>
			}
		>
			<div className="grid grid-cols-7 items-center justify-between gap-6 text-xs p-3">
				<div>
					<span className="uppercase-label-text">Location</span>
					<br />
					{epcData.location || "--"}
				</div>

				<div>
					<span className="uppercase-label-text">Branch</span>
					<br />
					{getEpcBranchName(epcData)}
				</div>

				<div>
					<span className="uppercase-label-text">Department</span>
					<br />
					{getEpcDepartmentName(epcData)}
				</div>

				<div>
					<span className="uppercase-label-text">Vertical</span>
					<br />
					{getEpcVerticalName(epcData)}
				</div>

				<div>
					<span className="uppercase-label-text">Zone</span>
					<br />
					{getEpcRegionName(epcData)}
				</div>

				<div>
					<span className="uppercase-label-text">Created</span>
					<br />
					{formatDate(epcData.created_at)}
				</div>

				<div>
					<span className="uppercase-label-text">Budget</span>
					<br />
					{getEpcBudgetValue(epcData)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6 text-sm p-3">
				<div>
					<span className="uppercase-label-text">Description</span>
					<p className="text-black leading-relaxed text-xs text-wrap">
						{trimText(epcData.event_description, 250) || "No Description"}
					</p>
				</div>

				<div>
					<span className="uppercase-label-text">Objective</span>
					<p className="text-gray-700 leading-relaxed text-xs text-wrap">
						{trimText(epcData.event_objective, 250) || "No Objective"}
					</p>
				</div>
			</div>
		</Section>
	);
};

export default ActivityDetailsSection;
