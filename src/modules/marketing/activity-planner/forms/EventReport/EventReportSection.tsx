import React from "react";
import { CheckCircle2, Eye, FileText, Pencil } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Section from "../../components/Section";
import type { EventReportDetail } from "./types";

type EventReportSectionProps = {
	report?: EventReportDetail | null;
	isProposer: boolean;
	isValidator: boolean;
	hasValidatorPreviewed?: boolean;
	isValidating?: boolean;
	onOpenReportBuilder: () => void;
	onOpenReportPreview: () => void;
	onValidateReport?: () => void;
};

export const EventReportSection = ({
	report,
	isProposer,
	isValidator,
	hasValidatorPreviewed = false,
	isValidating = false,
	onOpenReportBuilder,
	onOpenReportPreview,
	onValidateReport,
}: EventReportSectionProps) => {
	const reportStatus = report?.status;

	const isReportCreated = Boolean(report?.id);
	const isSubmitted = reportStatus === "SUBMITTED";
	const isValidated = reportStatus === "VALIDATED";

	const canProposerCreate = isProposer && !isReportCreated;

	const canProposerEdit =
		isProposer && isReportCreated && !isSubmitted && !isValidated;

	const canPreview = isReportCreated;

	const canValidatorValidate =
		isValidator && isSubmitted && hasValidatorPreviewed && Boolean(report?.id);

	const title = !isReportCreated
		? "Create Report"
		: isValidator
			? "Preview Report"
			: canProposerEdit
				? "Edit Report"
				: "Preview Report";

	const description = !isReportCreated
		? "Create activity report after event is conducted"
		: `Current status: ${reportStatus ?? "--"}`;

	return (
		<Section title="Activity Report Section">
			<div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
				<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-orange-200 hover:bg-orange-50/30">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
							<FileText className="h-4 w-4 text-gray-700" />
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-900">{title}</h3>
							<p className="mt-0.5 text-xs text-gray-500">{description}</p>
						</div>
					</div>

					{canProposerCreate || canProposerEdit ? (
						<Button
							type="button"
							size="sm"
							status="outline"
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
								onOpenReportBuilder();
							}}
						>
							<Pencil className="h-4 w-4" />
							{canProposerCreate ? "Create" : "Edit"}
						</Button>
					) : (
						canPreview && (
							<Button
								type="button"
								size="sm"
								status="outline"
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenReportPreview();
								}}
							>
								<Eye className="h-4 w-4" />
								Preview
							</Button>
						)
					)}
				</div>

				{isValidator && isSubmitted && (
					<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
						<div>
							<h3 className="text-sm font-medium text-gray-900">
								Validate Report
							</h3>
							<p className="mt-0.5 text-xs text-gray-500">
								Preview the report before validating it
							</p>
						</div>

						<Button
							type="button"
							size="sm"
							status="outline"
							onClick={(e: React.MouseEvent) => {
								e.stopPropagation();
								onValidateReport?.();
							}}
							disabled={!canValidatorValidate || isValidating}
						>
							<CheckCircle2 className="h-4 w-4" />
							{isValidating ? "Validating..." : "Validate"}
						</Button>
					</div>
				)}

				{isValidated && (
					<div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
						<div>
							<h3 className="text-sm font-medium text-green-900">
								Report Validated
							</h3>
							<p className="mt-0.5 text-xs text-green-700">
								This activity report has been validated.
							</p>
						</div>
					</div>
				)}
			</div>
		</Section>
	);
};
