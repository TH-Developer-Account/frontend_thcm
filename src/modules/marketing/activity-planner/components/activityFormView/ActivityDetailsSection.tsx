import { Pencil } from "lucide-react";
import Button from "../../../../../components/common/Button";
import Section from "../common/Section";
import EpcForm from "../../forms/EPC/EpcForm";
import type { EpcDetailResponse } from "../../types/epc.types";
import { formatDate, trimText } from "../../../../../utils/format";
import {
	getEpcBranchName,
	getEpcBudgetValue,
	getEpcDepartmentName,
	getEpcRegionName,
	getEpcVerticalName,
} from "../../utils/formatters";
import DateRangeSection from "./DateRangeSection";

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
			<div className="mt-3 px-2">
				<DateRangeSection
					fromDate={epcData.event_from_date}
					toDate={epcData.event_to_date}
				/>

				<div className="grid grid-cols-1 gap-3 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
					<div className="min-w-0">
						<span className="uppercase-label-text">Location</span>
						<p
							className="mt-0.5 max-w-full break-words text-[11px] leading-4 text-gray-900"
							title={epcData.location || "--"}
						>
							{epcData.location || "--"}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Branch</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{getEpcBranchName(epcData)}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Department</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{getEpcDepartmentName(epcData)}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Vertical</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{getEpcVerticalName(epcData)}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Zone</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{getEpcRegionName(epcData)}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Created</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{formatDate(epcData.created_at)}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Budget</span>
						<p className="mt-0.5 truncate text-[11px] leading-4 text-gray-900">
							{getEpcBudgetValue(epcData)}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 p-3 text-sm md:grid-cols-2">
					<div className="min-w-0">
						<span className="uppercase-label-text">Description</span>
						<p className="mt-1 break-words text-xs leading-relaxed text-gray-900">
							{trimText(epcData.event_description, 250) || "No Description"}
						</p>
					</div>

					<div className="min-w-0">
						<span className="uppercase-label-text">Objective</span>
						<p className="mt-1 break-words text-xs leading-relaxed text-gray-700">
							{trimText(epcData.event_objective, 250) || "No Objective"}
						</p>
					</div>
				</div>
			</div>
		</Section>
	);
};

export default ActivityDetailsSection;
