import { Eye, Send } from "lucide-react";

import { PageHeader } from "../../../../components/ui/PageHeader";
import Button from "../../../../components/common/Button";
import { Badge } from "../../../../components/common/Badge";
import { statusMap } from "../../../../utils/types";

import type { EpcDetailResponse } from "../types/epc.types";
import {
	getUpdatedSectionsLabel,
	type UpdatedSection,
} from "../utils/activityPlannerStatus.helper";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	loading?: boolean;
	onPreview: () => void;

	isClarifiedPending?: boolean;
	updatedSections?: Set<UpdatedSection>;
	canSubmitClarifiedUpdate?: boolean;
	isSubmittingClarifiedUpdate?: boolean;
	onSubmitClarifiedUpdate?: () => void | Promise<void>;
};

const ActivityPlannerHeader = ({
	epcData,
	createdBy,
	loading,
	onPreview,
	isClarifiedPending = false,
	updatedSections = new Set(),
	canSubmitClarifiedUpdate = false,
	isSubmittingClarifiedUpdate = false,
	onSubmitClarifiedUpdate,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || null;
	const proposalNo = epcData?.proposal_number || null;
	const badgeStatus = epcData?.status ? statusMap[epcData.status] : undefined;

	const updatedSectionsLabel = getUpdatedSectionsLabel(updatedSections);

	return (
		<div className="flex flex-row gap-4 justify-between items-center">
			<PageHeader
				headerText="Activity Planner View"
				badgeProps={{
					text: "Back",
					to: "/marketing/listing",
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
						{isClarifiedPending && (
							<>
								<span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
									{updatedSectionsLabel}
								</span>

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
									disabled={
										!epcData ||
										loading ||
										!canSubmitClarifiedUpdate ||
										isSubmittingClarifiedUpdate
									}
									className="p-1 text-xs  cursor-pointer"
								/>
							</>
						)}

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
							{createdBy || null}
						</span>
						<Badge status={badgeStatus} />
					</p>
				</div>
			</div>
		</div>
	);
};

export default ActivityPlannerHeader;
