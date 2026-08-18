import React from "react";
import {
	AlertCircle,
	CheckCircle2,
	Eye,
	FileText,
	Pencil,
	MessageSquareWarning,
} from "lucide-react";

import Button from "../../../../../components/common/Button";
import { getEventReportSectionState } from "./eventReport.logic";
import type { EventReportSectionProps } from "../../types/event.report.types";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

export const EventReportSection = ({
	report,
	isProposer,
	isValidator,
	canCreateReport = false,
	hasValidatorPreviewed = false,
	isValidating = false,
	isClarifying = false,
	onOpenReportBuilder,
	onOpenReportPreview,
	onValidateReport,
	onClarifyReport,
}: EventReportSectionProps) => {
	const {
		shouldShowSection,
		isSubmitted,
		isValidated,
		canProposerCreate,
		canProposerEdit,
		canPreview,
		canValidatorValidate,
		title,
		description,
	} = getEventReportSectionState({
		report,
		isProposer,
		isValidator,
		hasValidatorPreviewed,
		isValidating,
		canCreateReport,
	});

	const canValidatorClarify = canValidatorValidate;

	if (!shouldShowSection) return null;

	return (
		<SectionAccordion title="Activity Report Section">
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
							appearance="standard"
							variant="outline"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
								onOpenReportBuilder();
							}}
							Icon={Pencil}
							isTooltip={
								canProposerCreate ? "Create report" : "Edit and resubmit report"
							}
							text={canProposerCreate ? "Create" : "Edit"}
						/>
					) : canPreview ? (
						<Button
							type="button"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
								onOpenReportPreview();
							}}
							isTooltip="View report"
							Icon={Eye}
							text="Preview"
						/>
					) : null}
				</div>

				{isValidator && isSubmitted && (
					<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
						<div>
							<h3 className="text-sm font-medium text-gray-900">
								Validate Report
							</h3>
							<p className="mt-0.5 text-xs text-gray-500">
								Preview the report before validating it.
							</p>
						</div>

						<Button
							type="button"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
								onValidateReport?.();
							}}
							disabled={!canValidatorValidate || isValidating || isClarifying}
							isTooltip={
								hasValidatorPreviewed
									? "Validate report"
									: "Preview report first"
							}
							Icon={CheckCircle2}
							text={isValidating ? "Validating..." : "Validate"}
						></Button>
					</div>
				)}

				{isValidator && isSubmitted && (
					<div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
						<div>
							<h3 className="text-sm font-medium text-gray-900">
								Clarify Report
							</h3>
							<p className="mt-0.5 text-xs text-gray-500">
								Send this report back to proposer for correction.
							</p>
						</div>

						<Button
							type="button"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
								onClarifyReport?.();
							}}
							disabled={!canValidatorClarify || isValidating || isClarifying}
							isTooltip={
								hasValidatorPreviewed
									? "Clarify report"
									: "Preview report first"
							}
							Icon={MessageSquareWarning}
							text={isClarifying ? "Clarifying..." : "Clarify"}
						></Button>
					</div>
				)}

				{canProposerEdit && (
					<div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
						<div className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4 text-amber-700" />
							<div>
								<h3 className="text-sm font-medium text-amber-900">
									Report Requires Changes
								</h3>
								<p className="mt-0.5 text-xs text-amber-700">
									Please update and resubmit the report.
								</p>
							</div>
						</div>
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
		</SectionAccordion>
	);
};
