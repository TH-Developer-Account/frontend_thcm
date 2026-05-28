import { Send } from "lucide-react";
import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import { Badge } from "../../../../components/common/Badge";
import { statusMap } from "../../../../utils/types";

import type { EpcDetailResponse } from "../types/epc.types";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	loading?: boolean;
	isSubmittingClarifiedUpdate?: boolean;
	onSubmitClarifiedUpdate?: () => void | Promise<void>;
};

const ActivityPlannerHeader = ({
	epcData,
	createdBy,
	loading,
	isSubmittingClarifiedUpdate = false,
	onSubmitClarifiedUpdate,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || null;
	const proposalNo = epcData?.proposal_number || null;
	const workflowStatus = epcData?.activeWorkflow?.status?.toUpperCase();
	const epcStatus = epcData?.status?.toUpperCase();
	const isClarified = workflowStatus === "CLARIFY" || epcStatus === "CLARIFY";

	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;

	return (
		<div className="flex flex-row gap-4 justify-between items-start">
			<PageHeader
				badgeProps={{
					text: "Back",
					direction: "back",
				}}
			/>

			<div className="flex justify-between flex-col items-center page-header-section">
				<h2 className="page-title-section">{title}</h2>

				<p className="page-subtitle">
					<span className="uppercase-label-text">{proposalNo}</span>
				</p>
			</div>

			<div className="flex justify-between items-center page-header-section text-right">
				<div className="flex flex-col items-end">
					<div className="flex gap-2 justify-end">
						{isClarified && (
							<Button
								type="button"
								text={
									isSubmittingClarifiedUpdate
										? "Submitting..."
										: "Save & Final Submit"
								}
								Icon={Send}
								iconPosition="right"
								onClick={onSubmitClarifiedUpdate}
								status="brand"
								disabled={!epcData || loading || isSubmittingClarifiedUpdate}
								className="p-1 text-xs cursor-pointer"
							/>
						)}
					</div>

					<p className="flex items-center gap-1.5 mt-1 text-[12px] leading-4">
						<span className="font-semibold uppercase tracking-[0.06em] text-gray-900">
							{createdBy ? `Proposer ${createdBy}` : null}
						</span>

						<span className="uppercase-label-text">Status:</span>
						<Badge status={badgeStatus} text="Status" />
					</p>
				</div>
			</div>
		</div>
	);
};

export default ActivityPlannerHeader;
