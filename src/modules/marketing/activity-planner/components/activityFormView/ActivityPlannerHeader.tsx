import { Eye } from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import Button from "../../../../../components/common/Button";
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
		<section
			className="activity-planner-summary"
			aria-label="Activity planner summary"
		>
			<div className="activity-planner-summary-main">
				<div className="activity-planner-summary-copy">
					<h2 className="activity-planner-summary-title">{title}</h2>

					<p className="activity-planner-summary-proposal">
						{proposalNo !== "--" ? `[ ${proposalNo} ]` : "--"}
					</p>
				</div>

				<div className="activity-planner-summary-actions">
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
				</div>
			</div>

			<div className="activity-planner-summary-meta">
				<div className="activity-planner-summary-meta-item">
					<span className="activity-planner-summary-label">Proposer</span>

					<span className="activity-planner-summary-value">
						{proposerName || "--"}
					</span>
				</div>

				<div className="activity-planner-summary-meta-item activity-planner-summary-status">
					<span className="activity-planner-summary-label">Status</span>

					<Badge status={status} />
				</div>
			</div>
		</section>
	);
};

export default ActivityPlannerHeader;
