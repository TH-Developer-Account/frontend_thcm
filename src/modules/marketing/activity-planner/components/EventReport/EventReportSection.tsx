// EventReportSection.tsx
import { FileText, Upload, ShieldCheck } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../Section";

type EventReportSectionProps = {
	eventStatus: string;
	epcID?: string | null;

	report?: {
		id?: string;
		status?: "DRAFT" | "SUBMITTED" | "APPROVED";
		pdfUrl?: string;
	};

	onUpload?: () => void;
	onSubmitValidation?: () => void;
	isSubmitting?: boolean;
	onOpenReportBuilder: () => void;
};

export const EventReportSection = ({
	eventStatus,
	report,
	onUpload,
	onSubmitValidation,
	isSubmitting,
	onOpenReportBuilder,
}: EventReportSectionProps) => {
	if (eventStatus !== "CONDUCTED") {
		return null;
	}

	const isReportCreated = Boolean(report?.id);

	return (
		<Section
			title="Activity Report Section"
			// action={
			// 	<>
			// 		<Button text={"Submit Report"} size="sm" />
			// 		{report?.status ? (
			// 			<div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
			// 				<CheckCircle2 className="h-3.5 w-3.5" />
			// 				{report.status}
			// 			</div>
			// 		) : null}
			// 	</>
			// }
		>
			<div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
				{/* Create Report */}
				<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
							<FileText className="h-4 w-4 text-gray-700" />
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-900">
								{isReportCreated ? "Continue Report" : "Create Report"}
							</h3>
						</div>
					</div>

					<Button size="sm" status="outline" onClick={onOpenReportBuilder}>
						Open
					</Button>
				</div>

				{/* Upload PDF */}
				<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
							<Upload className="h-4 w-4 text-gray-700" />
						</div>

						<h3 className="text-sm font-medium text-gray-900">Upload PDF</h3>
					</div>

					<Button size="sm" status="outline" onClick={onUpload}>
						Upload
					</Button>
				</div>

				{/* Submit */}
				<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
							<ShieldCheck className="h-4 w-4 text-gray-700" />
						</div>

						<h3 className="text-sm font-medium text-gray-900">
							Submit Validation
						</h3>
					</div>

					<Button
						size="sm"
						status="outline"
						onClick={onSubmitValidation}
						disabled={isSubmitting || !isReportCreated}
					>
						Submit
					</Button>
				</div>
			</div>
		</Section>
	);
};
