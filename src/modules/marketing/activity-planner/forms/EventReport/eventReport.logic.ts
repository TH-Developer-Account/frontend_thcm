import type { ReportStatus, EventReportDetail } from "./eventReport.types";

const normalizeStatus = (s?: string | null) =>
  String(s ?? "")
    .trim()
    .toUpperCase();

export const getReportStatusLabel = (
  status?: ReportStatus | string | null,
): string => {
  switch (normalizeStatus(status)) {
    case "GENERATING":
      return "Generating";
    case "GENERATION_FAILED":
      return "Generation Failed";
    case "SUBMITTED":
      return "Submitted";
    case "VALIDATED":
      return "Validated";
    case "CLARIFICATION_REQUESTED":
      return "Clarification Requested";
    default:
      return status || "--";
  }
};

type UseEventReportSectionProps = {
  report?: EventReportDetail | null;
  isProposer?: boolean;
  isValidator?: boolean;
  canCreateReport?: boolean;
};

export const getEventReportSectionState = ({
  report,
  isProposer,
  isValidator,
  canCreateReport = false,
}: UseEventReportSectionProps) => {
  const status = report?.status;
  const isReportCreated = Boolean(report?.id);

  const isGenerating = status === "GENERATING";
  const isGenerationFailed = status === "GENERATION_FAILED";
  const isSubmitted = status === "SUBMITTED";
  const isValidated = status === "VALIDATED";
  const isClarificationRequested = status === "CLARIFICATION_REQUESTED";

  const shouldShowSection = canCreateReport || isReportCreated;

  const canProposerCreate =
    Boolean(isProposer) && canCreateReport && !isReportCreated;
  const canProposerResubmit =
    Boolean(isProposer) && isReportCreated && isClarificationRequested;
  const canProposerRetry =
    Boolean(isProposer) && isReportCreated && isGenerationFailed;
  const canDownload = isReportCreated && isSubmitted && Boolean(report?.pdfUrl);
  const canValidatorValidate =
    Boolean(isValidator) && isSubmitted && Boolean(report?.id);
  const canValidatorClarify = canValidatorValidate;

  const statusLabel = getReportStatusLabel(status);

  const title = !isReportCreated
    ? "Create Report"
    : canProposerResubmit
      ? "Edit Report"
      : canProposerRetry
        ? "Retry Generation"
        : isGenerating
          ? "Generating Report"
          : "Report";

  const description = !isReportCreated
    ? "Create activity report after event is conducted."
    : canProposerResubmit
      ? "Report needs correction. Proposer can edit and resubmit."
      : canProposerRetry
        ? "Report generation failed. You can retry."
        : isGenerating
          ? "Your report is being generated. You'll be notified when it's ready."
          : `Current status: ${statusLabel}`;

  return {
    shouldShowSection,
    isReportCreated,
    isGenerating,
    isGenerationFailed,
    isSubmitted,
    isValidated,
    isClarificationRequested,
    canProposerCreate,
    canProposerResubmit,
    canProposerRetry,
    canDownload,
    canValidatorValidate,
    canValidatorClarify,
    title,
    description,
  };
};
