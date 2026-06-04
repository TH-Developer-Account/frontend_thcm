import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";
import ActivityPlannerPdfTemplate from "./ActivityPlannerPdfTemplate";
import type { EpcDetailResponse } from "../../types/epc.types";

type ActivityPlannerPdfPreviewProps = {
	open: boolean;
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	onClose: () => void;
};

const ActivityPlannerPdfPreview = ({
	open,
	epcData,
	createdBy,
	onClose,
}: ActivityPlannerPdfPreviewProps) => {
	const proposalNo = epcData?.proposal_number || "activity-planner";

	const handleDownload = async () => {
		const element = document.getElementById("pdf-content");
		if (!element) return;

		document.body.classList.add("pdf-export-mode");

		try {
			await html2pdf()
				.set({
					margin: 8,
					filename: `${proposalNo}.pdf`,
					image: { type: "jpeg", quality: 0.98 },
					html2canvas: {
						scale: 2,
						useCORS: true,
						backgroundColor: "#ffffff",
					},
					jsPDF: {
						unit: "mm",
						format: "a4",
						orientation: "portrait",
					},
				})
				.from(element)
				.save();
		} finally {
			document.body.classList.remove("pdf-export-mode");
		}
	};

	return (
		<Modal
			open={open}
			title="PDF Preview"
			onClose={onClose}
			size="xl"
			className="content-box"
			header_children={
				<Button
					type="button"
					text="Download PDF"
					Icon={Download}
					iconPosition="right"
					onClick={handleDownload}
					status="brand"
					size="sm"
					disabled={!epcData}
				/>
			}
		>
			<div className="max-h-[90vh] overflow-y-auto scrollbar-sleek">
				<div id="pdf-content" className="text-[#111827] mx-auto">
					<ActivityPlannerPdfTemplate
						epcData={epcData ?? undefined}
						createdBy={createdBy}
					/>
				</div>
			</div>
		</Modal>
	);
};

export default ActivityPlannerPdfPreview;
