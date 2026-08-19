export type ReportStatus =
  | "GENERATING"
  | "GENERATION_FAILED"
  | "SUBMITTED"
  | "VALIDATED"
  | "REJECTED"
  | "CLARIFICATION_REQUESTED";

export type EventReportFormConfig = {
  minImages: number;
  maxImages: number;
  dualVariant: boolean;
  sourceType: "LEAD_FORM" | "DATA_FORM";
};

// ── Form-state representation of one image slot. Distinguishes a
// freshly-picked file (has `file`, no `id`) from an already-uploaded image
// being retained/replaced on resubmit (has `id`, may or may not have a new
// `file`). `position` is 1-based, matching the backend's EventReportImage
// contract exactly. ─────────────────────────────────────────────────────
export type EventReportImageSlot = {
  position: number;
  id?: string; // present only for images that already exist on the report
  file?: File; // present when this slot has a newly picked/replaced file
  previewUrl: string; // object URL for a new file, or the signed URL for an existing one
  caption: string;
};

export type ResolvedFieldValue =
  | { reportLabel: string; value: unknown }
  | {
      reportLabel: string;
      tataHitachiValue: unknown;
      competitionValue: unknown;
    };

export type EventReportComputedOutcomes = {
  inputFields: ResolvedFieldValue[];
  outcomeFields: ResolvedFieldValue[];
};

export type EventReportImage = {
  id: string;
  position: number;
  caption: string | null;
  url: string;
};

export type EventReportDetail = {
  id: string;
  epcId: string;
  status: ReportStatus;
  eventHighlights: string | null;
  computedOutcomes: EventReportComputedOutcomes | null;
  rejectionReason: string | null;
  clarificationReason: string | null;
  generationError: string | null;
  pdfUrl: string | null;
  submittedAt: string;
  resubmittedAt: string | null;
  validatedAt: string | null;
  validatorId: string;
  images: EventReportImage[];
};

export type SubmitReportPayload = {
  epcId: string;
  images: File[];
  captions: string[];
  eventHighlights?: string;
};

export type ResubmitReportPayload = {
  epcId: string;
  images: File[];
  positions: number[];
  captions: string[];
  eventHighlights?: string;
};
