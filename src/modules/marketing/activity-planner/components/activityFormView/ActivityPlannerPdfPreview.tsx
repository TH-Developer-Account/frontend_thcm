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

type Html2CanvasOptions = {
	scale?: number;
	useCORS?: boolean;
	backgroundColor?: string;
	letterRendering?: boolean;
	logging?: boolean;
};

type JsPdfOptions = {
	unit?: "pt" | "mm" | "cm" | "in" | "px" | "pc" | "em" | "ex";
	format?: string | [number, number];
	orientation?: "portrait" | "landscape";
};

type Html2PdfPagebreakOptions = {
	mode?: Array<"avoid-all" | "css" | "legacy">;
	before?: string | string[];
	after?: string | string[];
	avoid?: string | string[];
};

type Html2PdfOptions = {
	margin?: number | number[];
	filename?: string;
	image?: {
		type: "jpeg" | "png" | "webp";
		quality: number;
	};
	html2canvas?: Html2CanvasOptions;
	jsPDF?: JsPdfOptions;
	pagebreak?: Html2PdfPagebreakOptions;
};

/**
 * html2pdf.js exposes a fluent worker API at runtime, but some versions of
 * its TypeScript declaration incorrectly type html2pdf() as Promise<void>.
 */
type Html2PdfWorker = {
	set(options: Html2PdfOptions): Html2PdfWorker;
	from(source: HTMLElement): Html2PdfWorker;
	save(): Promise<void>;
};

type Html2PdfFactory = () => Html2PdfWorker;

const createHtml2PdfWorker = (): Html2PdfWorker => {
	return (html2pdf as unknown as Html2PdfFactory)();
};

const ActivityPlannerPdfPreview = ({
	open,
	epcData,
	createdBy,
	onClose,
	workflowEntries = [],
}: ActivityPlannerPdfPreviewProps) => {
	const proposalNo = epcData?.proposal_number?.trim() || "activity-planner";

	const handleDownload = async (): Promise<void> => {
		const element = document.getElementById("activity-planner-pdf-export");

		if (!element || !epcData) {
			return;
		}

		const pdfOptions: Html2PdfOptions = {
			margin: [8, 8, 8, 8],
			filename: `${proposalNo}.pdf`,
			image: {
				type: "jpeg",
				quality: 0.98,
			},
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

		document.body.classList.add("pdf-export-mode");

		try {
			await createHtml2PdfWorker().set(pdfOptions).from(element).save();
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
