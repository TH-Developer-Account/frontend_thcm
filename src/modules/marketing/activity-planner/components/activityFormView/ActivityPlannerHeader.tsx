import { FileDown, FileSpreadsheet } from "lucide-react";

import { Badge } from "../../../../../components/common/Badge";
import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";
import type { EpcDetailResponse } from "../../types/epc.types";

type ActivityPlannerHeaderProps = {
	epcData?: EpcDetailResponse | null;
	proposerName?: string;
	loading?: boolean;
	onPreview: () => void;

	isPreparingPdf?: boolean;
	isDownloadingPdf?: boolean;
	isExportingExcel?: boolean;
	onDownloadPdf?: () => void | Promise<void>;
	onExportExcel?: () => void | Promise<void>;
};

const ActivityPlannerHeader = ({
	epcData,
	proposerName,
	isPreparingPdf = false,
	isDownloadingPdf = false,
	isExportingExcel = false,
	onDownloadPdf,
	onExportExcel,
}: ActivityPlannerHeaderProps) => {
	const title = epcData?.event_name?.title || "Activity Planning Calendar";

	const proposalNo = epcData?.proposal_number || "--";
	const status = epcData?.status || "IN_PROGRESS";
	const epcId = epcData?.id ?? "";

	const activityActions: ActionMenuItem<string>[] = [
		{
			id: "download-pdf",
			label: isPreparingPdf || isDownloadingPdf ? "Downloading…" : "PDF",
			Icon: FileDown,
			onClick: () => void onDownloadPdf?.(),
			disabled: !onDownloadPdf || isPreparingPdf || isDownloadingPdf,
		},
		{
			id: "export-excel",
			label: isExportingExcel ? "Exporting…" : "Excel",
			Icon: FileSpreadsheet,
			onClick: () => void onExportExcel?.(),
			disabled: !onExportExcel || isExportingExcel,
		},
	];

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
					<ActionMenu
						size="xs"
						row={epcId}
						actions={activityActions}
						ariaLabel="Activity planner export actions"
						triggerLabel="Export"
						triggerVariant="brand"
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
