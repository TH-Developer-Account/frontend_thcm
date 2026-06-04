import {
	CalendarDays,
	MapPin,
	Users,
	TrendingUp,
	CheckCircle2,
	Download,
} from "lucide-react";
import { Modal } from "../../../../../components/common/Modal";
import Button from "../../../../../components/common/Button";
import type { EpcDetailResponse } from "../../types/epc.types";
import { formatDate } from "../../utils/formatters";
import { mapReportToPreviewImages } from "./eventReport.mapper";
import type { EventReportDetail } from "./types";

type PreviewProps = {
	open: boolean;
	onClose: () => void;
	epcData?: EpcDetailResponse | null;
	report?: EventReportDetail | null;
	loading?: boolean;
};

const Skeleton = ({ className = "" }: { className?: string }) => (
	<div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

const EventReportPreview = ({
	open,
	epcData,
	report,
	loading = false,
	onClose,
}: PreviewProps) => {
	const title = epcData?.event_name?.title;
	const proposalNo = epcData?.proposal_number;
	const epf = epcData?.epf;

	const totalParticipants =
		(Number(epf?.internalParticipants) || 0) +
		(Number(epf?.externalParticipants) || 0);

	const hasData =
		!!epcData &&
		(title || proposalNo || epcData?.event_description || epcData?.location);

	const previewImages = mapReportToPreviewImages(report);

	const summaryRows = [
		{
			label: "Internal Participants",
			value: epf?.internalParticipants || "--",
		},
		{
			label: "External Participants",
			value: epf?.externalParticipants || "--",
		},
		{
			label: "Total Participants",
			value: totalParticipants,
		},
		{
			label: "Total Leads Generated",
			value: report?.totalLeadsGenerated ?? "--",
		},
		{
			label: "Approved Event Cost",
			value: report?.approvedEventCost ?? "--",
		},
		{
			label: "Expected Conversion",
			value: report?.expectedConversion ?? "--",
		},
		{
			label: "Outcome Status",
			value: report?.outcomeStatus ?? "--",
		},
	];
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
					// onClick={handleDownload}
					status="brand"
					size="sm"
					// disabled={!epcData}
				/>
			}
		>
			<div className=" max-h-[90vh] overflow-y-auto scrollbar-sleek">
				{!loading && !hasData ? (
					<div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
						<CheckCircle2 className="mb-4 h-12 w-12 text-gray-300" />

						<h3 className="text-lg font-semibold text-gray-900">
							No Report Data Available
						</h3>

						<p className="mt-2 text-sm text-gray-500">
							Event report information has not been submitted yet.
						</p>
					</div>
				) : (
					<div className="mx-auto  rounded-sm border border-gray-200 bg-white shadow-sm">
						{/* HERO */}
						<div className="relative overflow-hidden bg-[#F58220] px-8 py-10">
							{/* Background Overlay */}
							<div className="absolute inset-0 bg-linear-to-r from-black/30 to-black/10" />

							{/* Brand Watermark */}
							<div className="absolute right-0 top-0 h-full w-[320px] opacity-10">
								<div className="flex h-full items-center justify-center text-[120px] font-black text-white">
									TH
								</div>
							</div>

							<div className="relative z-10">
								<div className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
									{/* EVENT REPORT */}
									{proposalNo}
								</div>

								<h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white">
									{loading ? (
										<Skeleton className="h-10 w-96" />
									) : hasData ? (
										title
									) : (
										"No Event Data Available"
									)}
								</h1>

								<p className="mt-4 max-w-3xl text-sm leading-7 text-white/90">
									{loading ? (
										<div className="space-y-2">
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-4 w-11/12" />
											<Skeleton className="h-4 w-9/12" />
										</div>
									) : hasData ? (
										epcData?.event_description
									) : (
										"No event description available."
									)}
								</p>

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
												<CalendarDays className="h-4 w-4" />
												{epcData?.event_from_date
													? formatDate(epcData.event_from_date)
													: "--"}
											</div>

											<div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
												<MapPin className="h-4 w-4" />
												{epcData?.location || "--"}
											</div>

											<div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
												<Users className="h-4 w-4" />
												{totalParticipants}
											</div>
										</>
									)}
								</div>
							</div>
						</div>

						{/* BODY */}
						<div className="space-y-8 p-8">
							{/* PHOTO GRID */}
							<div>
								<div className="mb-4 flex items-center justify-between">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											Event Highlights
										</h2>

										<p className="mt-1 text-sm text-gray-500">
											Photos captured during the event activities
										</p>
									</div>

									<div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
										{previewImages.length} Photos
									</div>
								</div>
								{loading ? (
									<div className="grid grid-cols-2 gap-4">
										{[1, 2, 3, 4].map((item) => (
											<Skeleton key={item} className="h-[240px] rounded-2xl" />
										))}
									</div>
								) : previewImages.length > 0 ? (
									<div className="grid grid-cols-2 gap-4">
										{previewImages.map((image, index) => (
											<div
												key={index}
												className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
											>
												<div className="relative h-[240px] overflow-hidden">
													<img
														src={image.url}
														alt=""
														className="h-full w-full object-cover"
													/>

													<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

													<div className="absolute bottom-0 left-0 right-0 p-4">
														<p className="text-sm font-medium text-white">
															{image.caption || `Event Photo ${index + 1}`}
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
										No event photos available
									</div>
								)}
							</div>

							{/* EVENT SUMMARY */}
							<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
								<div className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-orange-600" />

									<h2 className="text-lg font-semibold text-gray-900">
										Event Summary
									</h2>
								</div>

								<div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
									<table className="w-full border-collapse text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
													Metric
												</th>

												<th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
													Value
												</th>
											</tr>
										</thead>
										<tbody>
											{loading
												? Array.from({ length: 3 }).map((_, index) => (
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
							</div>

							{/* EVENT OUTCOME */}
							<div className="rounded-2xl border border-green-200 bg-green-50 p-5">
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
										<CheckCircle2 className="h-5 w-5 text-green-600" />
									</div>

									<div>
										<h2 className="text-lg font-semibold text-gray-900">
											Event Outcome
										</h2>

										{loading ? (
											<div className="space-y-3">
												<Skeleton className="h-5 w-40" />
												<Skeleton className="h-4 w-full" />
												<Skeleton className="h-4 w-11/12" />
												<Skeleton className="h-4 w-9/12" />
											</div>
										) : (
											<p className="mt-2 text-sm leading-7 text-gray-700">
												{report?.remarks ||
													"Outcome information not available."}
											</p>
										)}

										<div className="mt-4 flex flex-wrap gap-2">
											<div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700">
												Lead Generation Successful
											</div>

											<div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700">
												High Participation
											</div>

											<div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700">
												Product Awareness Increased
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
};

export default EventReportPreview;
