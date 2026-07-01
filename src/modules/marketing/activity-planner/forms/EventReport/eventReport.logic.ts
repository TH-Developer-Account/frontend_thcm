import type { EpcDetailResponse } from "../../types/epc.types";
import type { EventReportDetail } from "../../types/event.report.types";

export const REPORT_STATUS = {
	SUBMITTED: ["REPORT_SUBMITTED", "SUBMITTED"],
	RESUBMITTED: ["REPORT_RESUBMITTED", "RESUBMITTED"],
	VALIDATED: ["REPORT_VALIDATED", "VALIDATED"],
	EDITABLE: [
		"REPORT_REJECTED",
		"REJECTED",
		"REPORT_CLARIFICATION_REQUESTED",
		"CLARIFY_REPORT",
		"CLARIFICATION_REQUESTED",
	],
} as const;

// ─── Status Helpers ───────────────────────────────────────────────────────────

const normalizeStatus = (s?: string | null) =>
	String(s ?? "")
		.trim()
		.toUpperCase();

export const isOneOfReportStatuses = (
	status: string | null | undefined,
	statuses: readonly string[],
) => statuses.includes(normalizeStatus(status));

export const isSubmittedReport = (s?: string | null) =>
	isOneOfReportStatuses(s, [
		...REPORT_STATUS.SUBMITTED,
		...REPORT_STATUS.RESUBMITTED,
	]);
export const isValidatedReport = (s?: string | null) =>
	isOneOfReportStatuses(s, REPORT_STATUS.VALIDATED);
export const isEditableReport = (s?: string | null) =>
	isOneOfReportStatuses(s, REPORT_STATUS.EDITABLE);

export const getReportStatusLabel = (status?: string | null): string => {
	switch (normalizeStatus(status)) {
		case "REPORT_SUBMITTED":
		case "SUBMITTED":
			return "Submitted";
		case "REPORT_RESUBMITTED":
		case "RESUBMITTED":
			return "Resubmitted";
		case "REPORT_VALIDATED":
		case "VALIDATED":
			return "Validated";
		case "REPORT_REJECTED":
		case "REJECTED":
			return "Rejected";
		case "REPORT_CLARIFICATION_REQUESTED":
			return "Clarification requested for the report";
		case "CLARIFY_REPORT":
			return "Clarification Requested";
		default:
			return status || "--";
	}
};

type UseEventReportSectionProps = {
	report?: EventReportDetail | null;
	isProposer?: boolean;
	isValidator?: boolean;
	hasValidatorPreviewed?: boolean;
	isValidating?: boolean;
	canCreateReport?: boolean;
};

export const getEventReportSectionState = ({
	report,
	isProposer,
	isValidator,
	hasValidatorPreviewed,
	isValidating,
	canCreateReport = false,
}: UseEventReportSectionProps) => {
	const reportStatus = report?.status;
	const isReportCreated = Boolean(report?.id);
	const isSubmitted = isSubmittedReport(reportStatus);
	const isValidated = isValidatedReport(reportStatus);
	const isEditable = isEditableReport(reportStatus);

	const shouldShowSection = canCreateReport || isReportCreated;
	const canProposerCreate =
		Boolean(isProposer) && canCreateReport && !isReportCreated;
	const canProposerEdit = Boolean(isProposer) && isReportCreated && isEditable;
	const canPreview = isReportCreated;
	const canValidatorValidate =
		Boolean(isValidator) &&
		isSubmitted &&
		Boolean(hasValidatorPreviewed) &&
		Boolean(report?.id);

	const statusLabel = getReportStatusLabel(reportStatus);

	const title = !isReportCreated
		? "Create Report"
		: canProposerEdit
			? "Edit Report"
			: "Preview Report";

	const description = !isReportCreated
		? "Create activity report after event is conducted."
		: canProposerEdit
			? "Report needs correction. Proposer can edit and resubmit."
			: `Current status: ${statusLabel}`;

	return {
		shouldShowSection,
		isReportCreated,
		isSubmitted,
		isValidated,
		canProposerCreate,
		canProposerEdit,
		canPreview,
		canValidatorValidate,
		isValidating,
		title,
		description,
	};
};

export const getEventReportPreviewState = (
	epcData?: EpcDetailResponse | null,
	report?: EventReportDetail | null,
) => {
	const epf = epcData?.epf;

	const totalParticipants =
		(Number(epf?.internalParticipants) || 0) +
		(Number(epf?.externalParticipants) || 0);

	const hasData = Boolean(
		epcData &&
		(epcData.event_name?.title ||
			epcData.proposal_number ||
			epcData.event_description ||
			epcData.location),
	);

	const summaryRows = [
		{
			label: "Internal Participants",
			value: epf?.internalParticipants ?? "--",
		},
		{
			label: "External Participants",
			value: epf?.externalParticipants ?? "--",
		},
		{ label: "Total Participants", value: totalParticipants },
		{
			label: "Total Leads Generated",
			value: report?.totalLeadsGenerated ?? "--",
		},
		{ label: "Approved Event Cost", value: report?.approvedEventCost ?? "--" },
		{ label: "Expected Conversion", value: report?.expectedConversion ?? "--" },
		{ label: "Outcome Status", value: report?.outcomeStatus ?? "--" },
	];

	return { totalParticipants, hasData, summaryRows };
};
