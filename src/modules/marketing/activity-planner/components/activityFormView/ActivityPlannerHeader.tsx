import { Eye } from "lucide-react";
import { PageHeader } from "../../../../../components/ui/PageHeader";
import Button from "../../../../../components/common/Button";
import { Badge } from "../../../../../components/common/Badge";
import { statusMap } from "../../../../../utils/types";

import type { EpcDetailResponse } from "../../types/epc.types";
import { getStatusLabel } from "../../utils/formatters";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	loading?: boolean;
	onPreview: () => void;
};

const ActivityPlannerHeader = ({
	epcData,
	loading,
	createdBy,
	onPreview,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || null;
	const proposalNo = epcData?.proposal_number || null;
	const apiStatus = getStatusLabel(epcData?.status);
	const badgeStatus = epcData?.status ? apiStatus : undefined;

	return (
		<div className="flex flex-row gap-4 justify-between items-start">
			<PageHeader
				badgeProps={{
					text: "Back to Listing",
					direction: "back",
				}}
				children={
					<p className="flex items-center gap-1.5 px-4 text-[12px] leading-4">
						<span className="uppercase-label-text">Proposer:</span>
						{createdBy ? ` ${createdBy}` : null}
					</p>
				}
			/>

			<div className="flex justify-between flex-col items-center page-header-section">
				<h2 className="page-title-section">{title}</h2>

				<p className="page-subtitle">
					<span className="uppercase-label-text">{proposalNo}</span>
				</p>
			</div>

			<div className="flex justify-between items-center page-header-section text-right">
				<div className="flex flex-col items-end">
					<p className="flex items-center gap-1.5 mt-1 text-[12px] leading-4">
						<span className="uppercase-label-text">Status:</span>
						<Badge status={badgeStatus} text="Status" />
					</p>

					<div className="flex flex-row items-end px-2  mt-1">
						<Button
							type="button"
							Icon={Eye}
							text={"Preview"}
							size="sm"
							iconPosition="right"
							iconColor="orange"
							onClick={onPreview}
							className="bg-red-50 border-orange-500 text-orange-500 border px-1 py-0.5 rounded-full"
							disabled={!epcData || loading}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ActivityPlannerHeader;
