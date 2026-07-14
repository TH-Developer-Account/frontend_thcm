import { useEffect, useRef, useState } from "react";
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
	windowWidth?: number;
	scrollX?: number;
	scrollY?: number;
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

type Html2PdfWorker = {
	set(options: Html2PdfOptions): Html2PdfWorker;
	from(source: HTMLElement): Html2PdfWorker;
	toPdf(): Html2PdfWorker;
	outputPdf(type: "blob"): Promise<Blob>;
};

type Html2PdfFactory = () => Html2PdfWorker;

const createHtml2PdfWorker = (): Html2PdfWorker =>
	(html2pdf as unknown as Html2PdfFactory)();

const waitForDocumentResources = async (
	element: HTMLElement,
): Promise<void> => {
	if (document.fonts?.ready) {
		await document.fonts.ready;
	}

	const images = Array.from(element.querySelectorAll("img"));

	await Promise.all(
		images.map(
			(image) =>
				new Promise<void>((resolve) => {
					if (image.complete) {
						resolve();
						return;
					}

					image.addEventListener("load", () => resolve(), {
						once: true,
					});

					image.addEventListener("error", () => resolve(), {
						once: true,
					});
				}),
		),
	);

	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(resolve);
		});
	});
};

const getPdfBackgroundColor = (): string => {
	const rootStyles = window.getComputedStyle(document.documentElement);

	return (
		rootStyles.getPropertyValue("--color-clean-white").trim() ||
		rootStyles.getPropertyValue("--color-surface").trim() ||
		"white"
	);
};

const ActivityPlannerPdfPreview = ({
	open,
	epcData,
	createdBy,
	onClose,
	workflowEntries = [],
}: ActivityPlannerPdfPreviewProps) => {
	const exportRef = useRef<HTMLDivElement>(null);
	const activePdfUrlRef = useRef<string | null>(null);
	const generationIdRef = useRef(0);

	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);

	const proposalNo = epcData?.proposal_number?.trim() || "activity-planner";

	const replacePdfUrl = (nextUrl: string | null): void => {
		if (activePdfUrlRef.current) {
			URL.revokeObjectURL(activePdfUrlRef.current);
		}

		activePdfUrlRef.current = nextUrl;
		setPdfUrl(nextUrl);
	};

	useEffect(() => {
		if (!open || !epcData) {
			generationIdRef.current += 1;
			replacePdfUrl(null);
			setGenerationError(null);
			setIsGenerating(false);
			return;
		}

		const generationId = generationIdRef.current + 1;
		generationIdRef.current = generationId;

		const generatePreview = async (): Promise<void> => {
			setIsGenerating(true);
			setGenerationError(null);
			replacePdfUrl(null);

			const exportElement = exportRef.current;

			if (!exportElement) {
				setGenerationError("PDF preview content could not be prepared.");
				setIsGenerating(false);
				return;
			}

			try {
				document.body.classList.add("pdf-export-mode");

				await waitForDocumentResources(exportElement);

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
						backgroundColor: getPdfBackgroundColor(),
						letterRendering: true,
						logging: false,
						windowWidth: exportElement.scrollWidth,
						scrollX: 0,
						scrollY: 0,
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

				const pdfBlob = await createHtml2PdfWorker()
					.set(pdfOptions)
					.from(exportElement)
					.toPdf()
					.outputPdf("blob");

				if (generationIdRef.current !== generationId) {
					return;
				}

				const nextPdfUrl = URL.createObjectURL(pdfBlob);
				replacePdfUrl(nextPdfUrl);
			} catch (error) {
				if (generationIdRef.current !== generationId) {
					return;
				}

				setGenerationError(
					error instanceof Error
						? error.message
						: "Unable to generate the PDF preview.",
				);
			} finally {
				document.body.classList.remove("pdf-export-mode");

				if (generationIdRef.current === generationId) {
					setIsGenerating(false);
				}
			}
		};

		void generatePreview();

		return () => {
			generationIdRef.current += 1;
			document.body.classList.remove("pdf-export-mode");
		};
	}, [open, epcData, createdBy, workflowEntries, proposalNo]);

	useEffect(() => {
		return () => {
			if (activePdfUrlRef.current) {
				URL.revokeObjectURL(activePdfUrlRef.current);
				activePdfUrlRef.current = null;
			}
		};
	}, []);

	const handleDownload = (): void => {
		if (!pdfUrl) {
			return;
		}

		const link = document.createElement("a");

		link.href = pdfUrl;
		link.download = `${proposalNo}.pdf`;
		link.rel = "noopener";

		document.body.appendChild(link);
		link.click();
		link.remove();
	};

	return (
		<>
			<Modal
				open={open}
				title="PDF Preview"
				onClose={onClose}
				size="xl"
				className="pdf-viewer-modal"
				header_children={
					<Button
						text="Download PDF"
						Icon={Download}
						iconPosition="right"
						onClick={handleDownload}
						appearance="cta"
						variant="brand"
						size="sm"
						disabled={!pdfUrl || isGenerating}
					/>
				}
			>
				<div className="pdf-viewer">
					{isGenerating && (
						<div className="pdf-viewer-state" role="status" aria-live="polite">
							Generating PDF preview…
						</div>
					)}

					{generationError && !isGenerating && (
						<div
							className="pdf-viewer-state pdf-viewer-state-error"
							role="alert"
						>
							<p>{generationError}</p>
						</div>
					)}

					{pdfUrl && !isGenerating && !generationError && (
						<iframe
							key={pdfUrl}
							src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
							title={`PDF preview for ${proposalNo}`}
							className="pdf-viewer-frame"
						/>
					)}
				</div>
			</Modal>

			{open && epcData && (
				<div className="pdf-preview-render-host" aria-hidden="true">
					<div ref={exportRef} className="pdf-preview-sheet">
						<ActivityPlannerPdfTemplate
							epcData={epcData}
							createdBy={createdBy}
							workflowEntries={workflowEntries}
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default ActivityPlannerPdfPreview;
