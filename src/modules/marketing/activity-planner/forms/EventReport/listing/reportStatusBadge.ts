import type { ReportStatus } from "../eventReport.types";

type StatusBadgeStyle = { label: string; className: string };

// Pill-badge styling per status, matching the light-fill + colored-border
// treatment in the reference screenshot's "Report Submitted" badge.
export const REPORT_STATUS_BADGE: Record<ReportStatus, StatusBadgeStyle> = {
  GENERATING: {
    label: "Generating",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
  GENERATION_FAILED: {
    label: "Generation Failed",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  SUBMITTED: {
    label: "Report Submitted",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  VALIDATED: {
    label: "Validated",
    className: "bg-green-50 text-green-600 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  CLARIFICATION_REQUESTED: {
    label: "Clarification Requested",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};
