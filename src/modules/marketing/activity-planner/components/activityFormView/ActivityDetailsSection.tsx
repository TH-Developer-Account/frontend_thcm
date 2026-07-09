import { Pencil } from "lucide-react";
import Button from "../../../../../components/common/Button";
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
import { useState } from "react";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

type ActivityDetailsSectionProps = {
	epcData: EpcDetailResponse;
	isEditing: boolean;
	onEdit: () => void;
	onCancel: () => void;
	onSuccess: () => Promise<void>;
	canEdit?: boolean;
};

const ActivityDetailsSection = ({
	epcData,
	isEditing,
	onEdit,
	onCancel,
	onSuccess,
	canEdit,
}: ActivityDetailsSectionProps) => {
	const [showFullDescription, setShowFullDescription] = useState(false);
	const [showFullObjective, setShowFullObjective] = useState(false);

	const description = epcData.event_description || "";
	const objective = epcData.event_objective || "";

	const isDescriptionLong = description.length > 250;
	const isObjectiveLong = objective.length > 250;

	if (isEditing) {
		return (
			<EpcForm
				mode="edit"
				epcId={epcData.id}
				initialData={epcData}
				onCancel={onCancel}
				onSuccess={onSuccess}
			/>
		);
	}

	return (
		<SectionAccordion
			title="Activity Planner Details"
			action={
				canEdit ? (
					<Button
						type="button"
						Icon={Pencil}
						text="Edit EPC"
						size="sm"
						onClick={onEdit}
						appearance="standard"
						variant="outline"
					/>
				) : null
			}
		>
			<div className="activity-details-content">
				<DateRangeSection
					fromDate={epcData.event_from_date}
					toDate={epcData.event_to_date}
				/>

				<div className="activity-details-primary-grid">
					<div className="activity-detail-item">
						<span className="activity-detail-label">Branch</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{getEpcBranchName(epcData)}
						</p>
					</div>

					<div className="activity-detail-item">
						<span className="activity-detail-label">Department</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{getEpcDepartmentName(epcData)}
						</p>
					</div>

					<div className="activity-detail-item">
						<span className="activity-detail-label">Vertical</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{getEpcVerticalName(epcData)}
						</p>
					</div>

					<div className="activity-detail-item">
						<span className="activity-detail-label">Zone</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{getEpcRegionName(epcData)}
						</p>
					</div>

					<div className="activity-detail-item">
						<span className="activity-detail-label">Created</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{formatDate(epcData.created_at)}
						</p>
					</div>

					<div className="activity-detail-item">
						<span className="activity-detail-label">Budget</span>
						<p className="activity-detail-value activity-detail-value-truncate">
							{getEpcBudgetValue(epcData)}
						</p>
					</div>
				</div>

				<div className="activity-details-secondary-grid">
					<div className="activity-detail-item activity-detail-item-wide">
						<span className="activity-detail-label">Location</span>

						<p
							className="activity-detail-value activity-detail-value-wrap"
							title={epcData.location || "--"}
						>
							{epcData.location || "--"}
						</p>
					</div>

					<div className="activity-detail-item activity-detail-item-wide">
						<span className="activity-detail-label">Description</span>

						<p className="activity-detail-value activity-detail-value-wrap">
							{description
								? showFullDescription
									? description
									: trimText(description, 100)
								: "No Description"}

							{isDescriptionLong && (
								<button
									type="button"
									onClick={() =>
										setShowFullDescription((previous) => !previous)
									}
									className="activity-detail-more"
									aria-expanded={showFullDescription}
								>
									{showFullDescription ? "See less" : "See more"}
								</button>
							)}
						</p>
					</div>

					<div className="activity-detail-item activity-detail-item-wide">
						<span className="activity-detail-label">Objective</span>

						<p className="activity-detail-value activity-detail-value-wrap">
							{objective
								? showFullObjective
									? objective
									: trimText(objective, 100)
								: "No Objective"}

							{isObjectiveLong && (
								<button
									type="button"
									onClick={() => setShowFullObjective((previous) => !previous)}
									className="activity-detail-more"
									aria-expanded={showFullObjective}
								>
									{showFullObjective ? "See less" : "See more"}
								</button>
							)}
						</p>
					</div>
				</div>
			</div>
		</SectionAccordion>
	);
};

export default ActivityDetailsSection;
