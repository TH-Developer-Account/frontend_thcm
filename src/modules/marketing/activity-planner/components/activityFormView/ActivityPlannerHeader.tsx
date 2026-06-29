import { Eye } from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import type { EpcDetailResponse } from "../../types/epc.types";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	proposerName?: string;
	loading?: boolean;
	onPreview: () => void;
};

const ActivityPlannerHeader = ({
	epcData,
	loading = false,
	proposerName,
	onPreview,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || "Activity Planning Calendar";
	const proposalNo = epcData?.proposal_number || "--";
	const status = epcData?.status || "IN_PROGRESS";

	return (
		<PageHeader
			headerText={title}
			textAlign="text-center"
			subtitleText={`[ ${proposalNo} ]`}
			badgeProps={{
				text: "Back",
				to: "/marketing/listing",
				direction: "back",
			}}
			className="activity-planner-header"
			actionsClassName="activity-planner-header-toolbar"
			header_children={
				<Button
					type="button"
					text="Preview"
					Icon={Eye}
					iconPosition="left"
					iconSize={14}
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={onPreview}
					className="activity-planner-preview-button"
					disabled={!epcData || loading}
				/>
			}
			children={
				<div className="activity-planner-header-row">
					<div className="activity-planner-header-details">
						<div className="activity-planner-header-detail">
							<span className="activity-planner-header-label">Proposer:</span>

							<span className="activity-planner-header-value">
								{proposerName || "--"}
							</span>
						</div>
					</div>

					<div className="activity-planner-header-actions">
						<div className="activity-planner-header-status">
							<span className="activity-planner-header-label">Status:</span>
							<Badge status={status} />
						</div>
					</div>
				</div>
			}
		/>
	);
};

export default ActivityPlannerHeader;
