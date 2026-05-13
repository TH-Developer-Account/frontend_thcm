import { Eye } from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import { Badge } from "../../../../components/common/Badge";
import { statusMap } from "../../../../utils/types";
import type { EpcDetailResponse } from "../types/epc.types";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	loading?: boolean;
	onPreview: () => void;
};

const ActivityPlannerHeader = ({
	epcData,
	createdBy = "--",
	loading,
	onPreview,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || "Activity Planner";
	const proposalNo = epcData?.proposal_number || "--";
	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;

	return (
		<div className="flex flex-row gap-4 justify-between items-center">
			<PageHeader
				headerText="Activity Planner View"
				badgeProps={{
					text: "Back",
					direction: "back",
				}}
			/>

			<div className="flex justify-between flex-col items-center page-header-section">
				<h2 className="page-title-section">{title}</h2>

				<p className="page-subtitle">
					<span className="form-view-label uppercase-label-text">
						{proposalNo}
					</span>
				</p>
			</div>

			<div className="flex justify-between items-center page-header-section text-right">
				<div className="flex flex-col items-end">
					<div className="flex gap-2 justify-end">
						<Badge status={badgeStatus} />

						<Button
							type="button"
							Icon={Eye}
							iconPosition="right"
							onClick={onPreview}
							status="outline"
							disabled={!epcData || loading}
							className="p-1 text-xs rounded-full cursor-pointer"
						/>
					</div>

					<p className="flex items-center gap-1.5 mt-1 text-[12px] leading-4">
						<span className="text-gray-500">Proposer:</span>

						<span className="font-semibold uppercase tracking-[0.06em] text-gray-900">
							{createdBy || "--"}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default ActivityPlannerHeader;
