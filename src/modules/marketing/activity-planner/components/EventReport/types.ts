export type ReportImage = {
  url: string; // blob URL (local preview) or pre-signed S3 URL (fetched)
  file?: File; // only present for locally-selected images, not fetched ones
};

export type OutcomeStatus =
  | "SUCCESSFUL"
  | "PARTIALLY_SUCCESSFUL"
  | "UNSUCCESSFUL"
  | "";

export type FormState = {
  totalLeadsGenerated: string;
  outcomeStatus: OutcomeStatus;
  approvedEventCost: string;
  expectedConversion: string;
  remarks: string;
  formType: "CREATE" | "EDIT";
};

export type EventReportTemplateProps = {
  onBack: () => void;
  onPreview: () => void;
  eventCost?: number | string;
};
