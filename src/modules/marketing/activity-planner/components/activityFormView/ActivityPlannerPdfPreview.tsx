import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";
import ActivityPlannerPdfTemplate from "./ActivityPlannerPdfTemplate";
import type { EpcDetailResponse } from "../../types/epc.types";
import type { WorkflowComment } from "../../types/workflow.types";

type ActivityPlannerPdfPreviewProps = {
	open: boolean;
	epcData?: EpcDetailResponse | null;
	createdBy?: string;
	workflowEntries?: WorkflowComment[];
	onClose: () => void;
};

const ActivityPlannerPdfPreview = ({
	open,
	epcData,
	createdBy,
	onClose,
	workflowEntries = [],
}: ActivityPlannerPdfPreviewProps) => {
	const proposalNo = epcData?.proposal_number || "activity-planner";

	type Html2PdfPagebreakOptions = {
		mode?: Array<"avoid-all" | "css" | "legacy">;
		before?: string | string[];
		after?: string | string[];
		avoid?: string | string[];
	};

	type Html2PdfOptionsWithPagebreak = {
		margin: number | number[];
		filename: string;
		image: {
			type: "jpeg" | "png" | "webp";
			quality: number;
		};
		html2canvas: Record<string, unknown>;
		jsPDF: Record<string, unknown>;
		pagebreak?: Html2PdfPagebreakOptions;
	};

	const handleDownload = async () => {
		const element = document.getElementById("activity-planner-pdf-export");
		if (!element) return;

		document.body.classList.add("pdf-export-mode");

		const pdfOptions: Html2PdfOptionsWithPagebreak = {
			margin: [8, 8, 8, 8],
			filename: `${proposalNo}.pdf`,
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: {
				scale: 2,
				useCORS: true,
				backgroundColor: "#ffffff",
				letterRendering: true,
			},
			jsPDF: {
				unit: "mm",
				format: "a4",
				orientation: "portrait",
			},
			pagebreak: {
				mode: ["css", "legacy"],
				avoid: [".pdf-section-heading", ".pdf-metric-card", "tr"],
			},
		};

		try {
			await html2pdf()
				.set(pdfOptions as Parameters<ReturnType<typeof html2pdf>["set"]>[0])
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
					text="Download PDF"
					Icon={Download}
					iconPosition="right"
					onClick={handleDownload}
					appearance="cta"
					variant="brand"
					size="sm"
					disabled={!epcData}
				/>
			}
		>
			<div className="max-h-[90vh] overflow-y-auto bg-slate-100 px-4 py-5 scrollbar-sleek">
				<div
					id="activity-planner-pdf-export"
					className="pdf-preview-sheet mx-auto"
				>
					<ActivityPlannerPdfTemplate
						epcData={epcData ?? undefined}
						createdBy={createdBy}
						workflowEntries={workflowEntries}
					/>
				</div>
			</div>
		</Modal>
	);
};

export default ActivityPlannerPdfPreview;
