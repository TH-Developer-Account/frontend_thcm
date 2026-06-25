import { useState } from "react";
import {
	CalendarDays,
	CheckCircle2,
	Download,
	MapPin,
	TrendingUp,
	Users,
} from "lucide-react";
import html2pdf from "html2pdf.js";

import Button from "../../../../../components/common/Button";
import { Modal } from "../../../../../components/common/Modal";

import { formatDate } from "../../utils/formatters";
import { mapReportToPreviewImages } from "./eventReport.mapper";
import { getEventReportPreviewState } from "./eventReport.logic";

import type { PreviewProps } from "../../types/event.report.types";

type SkeletonProps = {
	className?: string;
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
 * Some html2pdf.js type declarations incorrectly describe html2pdf()
 * as Promise<void>, even though the runtime API returns a fluent worker.
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

const Skeleton = ({ className = "" }: SkeletonProps) => (
	<span
		aria-hidden="true"
		className={`inline-block animate-pulse rounded bg-gray-200 ${className}`}
	/>
);

const sanitizeFileName = (value: string): string => {
	const sanitized = value
		.trim()
		.replace(/[<>:"/\\|?*]/g, "-")
		.replace(/\s+/g, " ")
		.replace(/[.\s]+$/g, "");

	return sanitized || "event-report";
};

const EventReportPreview = ({
	open,
	epcData,
	report,
	loading = false,
	onClose,
}: PreviewProps) => {
	const [downloading, setDownloading] = useState(false);

	const { totalParticipants, hasData, summaryRows } =
		getEventReportPreviewState(epcData, report);

	const previewImages = mapReportToPreviewImages(report);

	const title = epcData?.event_name?.title;
	const proposalNo = epcData?.proposal_number;

	const handleDownload = async (): Promise<void> => {
		const element = document.getElementById("event-report-pdf-content");

		if (!element || downloading || !report) {
			return;
		}

		const rawFileName =
			epcData?.proposal_number || epcData?.event_name?.title || "event-report";

		const fileName = sanitizeFileName(rawFileName);

		const pdfOptions: Html2PdfOptions = {
			margin: [8, 8, 8, 8],
			filename: `${fileName}.pdf`,
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
				avoid: [
					".pdf-avoid-break",
					".pdf-section-heading",
					".pdf-photo-card",
					"tr",
				],
			},
		};

		document.body.classList.add("pdf-export-mode");
		setDownloading(true);

		try {
			await createHtml2PdfWorker().set(pdfOptions).from(element).save();
		} catch (error) {
			console.error("Failed to generate event report PDF:", error);
		} finally {
			document.body.classList.remove("pdf-export-mode");
			setDownloading(false);
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
					text={downloading ? "Generating PDF..." : "Download PDF"}
					Icon={Download}
					iconPosition="right"
					onClick={handleDownload}
					status="brand"
					size="sm"
					disabled={!report || loading || downloading}
				/>
			}
		>
			<div className="max-h-[90vh] overflow-y-auto scrollbar-sleek">
				{!loading && !hasData ? (
					<div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
						<CheckCircle2
							className="mb-4 h-12 w-12 text-gray-300"
							aria-hidden="true"
						/>

						<h3 className="text-lg font-semibold text-gray-900">
							No Report Data Available
						</h3>

						<p className="mt-2 text-sm text-gray-500">
							Event report information has not been submitted yet.
						</p>
					</div>
				) : (
					<div
						id="event-report-pdf-content"
						className="mx-auto overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
					>
						{/* Hero */}
						<section className="relative overflow-hidden bg-[#F58220] px-8 py-10">
							<div className="absolute inset-0 bg-linear-to-r from-black/30 to-black/10" />

							<div
								className="absolute right-0 top-0 h-full w-[320px] opacity-10"
								aria-hidden="true"
							>
								<div className="flex h-full items-center justify-center text-[120px] font-black text-white">
									TH
								</div>
							</div>

							<div className="relative z-10">
								{proposalNo ? (
									<div className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
										{proposalNo}
									</div>
								) : null}

								<h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white">
									{loading ? (
										<Skeleton className="h-10 w-full max-w-96 bg-white/20" />
									) : (
										title || "No Event Data Available"
									)}
								</h1>

								<div className="mt-4 max-w-3xl text-sm leading-7 text-white/90">
									{loading ? (
										<div className="space-y-2">
											<Skeleton className="h-4 w-full bg-white/20" />
											<Skeleton className="h-4 w-11/12 bg-white/20" />
										</div>
									) : (
										<p>
											{epcData?.event_description ||
												"No event description available."}
										</p>
									)}
								</div>

								<div className="mt-6 flex flex-wrap gap-3">
									{loading ? (
										<>
											<Skeleton className="h-10 w-40 bg-white/20" />
											<Skeleton className="h-10 w-40 bg-white/20" />
											<Skeleton className="h-10 w-40 bg-white/20" />
										</>
									) : (
										<>
											<div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
												<CalendarDays className="h-4 w-4" aria-hidden="true" />

												<span>
													{epcData?.event_from_date
														? formatDate(epcData.event_from_date)
														: "--"}
												</span>
											</div>

											<div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
												<MapPin className="h-4 w-4" aria-hidden="true" />

												<span>{epcData?.location || "--"}</span>
											</div>

											<div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
												<Users className="h-4 w-4" aria-hidden="true" />

												<span>{totalParticipants}</span>
											</div>
										</>
									)}
								</div>
							</div>
						</section>

						{/* Body */}
						<div className="space-y-8 p-8">
							{/* Photo grid */}
							<section>
								<div className="pdf-section-heading mb-4 flex items-center justify-between gap-4">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											Event Highlights
										</h2>

										<p className="mt-1 text-sm text-gray-500">
											Photos captured during the event activities
										</p>
									</div>

									<div className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
										{previewImages.length}{" "}
										{previewImages.length === 1 ? "Photo" : "Photos"}
									</div>
								</div>

								{loading ? (
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										{[1, 2, 3, 4].map((item) => (
											<Skeleton key={item} className="h-[240px] rounded-2xl" />
										))}
									</div>
								) : previewImages.length > 0 ? (
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										{previewImages.map((image, index) => {
											const imageUrl = image.url ?? undefined;

											return (
												<article
													key={imageUrl ?? `${image.caption}-${index}`}
													className="pdf-photo-card overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
												>
													<div className="relative h-[240px] overflow-hidden">
														{imageUrl ? (
															<img
																src={imageUrl}
																alt={
																	image.caption ||
																	`Event highlight ${index + 1}`
																}
																className="h-full w-full object-cover"
															/>
														) : (
															<div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
																Image unavailable
															</div>
														)}

														{imageUrl ? (
															<div
																className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
																aria-hidden="true"
															/>
														) : null}

														{image.caption ? (
															<div className="absolute bottom-0 left-0 right-0 p-4">
																<p className="text-sm font-medium text-white">
																	{image.caption}
																</p>
															</div>
														) : null}
													</div>
												</article>
											);
										})}
									</div>
								) : (
									<div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-300 px-4 text-center text-sm text-gray-500">
										No event photos available
									</div>
								)}
							</section>

							{/* Event summary */}
							<section className="pdf-avoid-break rounded-2xl border border-gray-200 bg-gray-50 p-5">
								<div className="pdf-section-heading flex items-center gap-2">
									<TrendingUp
										className="h-5 w-5 text-orange-600"
										aria-hidden="true"
									/>

									<h2 className="text-lg font-semibold text-gray-900">
										Event Summary
									</h2>
								</div>

								<div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
									<table className="w-full border-collapse text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th
													scope="col"
													className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700"
												>
													Metric
												</th>

												<th
													scope="col"
													className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700"
												>
													Value
												</th>
											</tr>
										</thead>

										<tbody>
											{loading
												? Array.from({
														length: 3,
													}).map((_, index) => (
														<tr key={index}>
															<td className="px-4 py-3">
																<Skeleton className="h-4 w-32" />
															</td>

															<td className="px-4 py-3">
																<Skeleton className="h-4 w-20" />
															</td>
														</tr>
													))
												: summaryRows.map((row) => (
														<tr key={row.label}>
															<td className="border-b border-gray-100 px-4 py-3 text-gray-600">
																{row.label}
															</td>

															<td className="border-b border-gray-100 px-4 py-3 font-medium text-gray-900">
																{row.value}
															</td>
														</tr>
													))}
										</tbody>
									</table>
								</div>
							</section>

							{/* Event outcome */}
							<section className="pdf-avoid-break rounded-2xl border border-green-200 bg-green-50 p-5">
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
										<CheckCircle2
											className="h-5 w-5 text-green-600"
											aria-hidden="true"
										/>
									</div>

									<div className="min-w-0">
										<h2 className="text-lg font-semibold text-gray-900">
											Event Outcome
										</h2>

										{loading ? (
											<div className="mt-2 space-y-3">
												<Skeleton className="h-5 w-40" />
												<Skeleton className="h-4 w-full" />
											</div>
										) : (
											<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
												{report?.remarks ||
													"Outcome information not available."}
											</p>
										)}
									</div>
								</div>
							</section>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
};

export default EventReportPreview;
