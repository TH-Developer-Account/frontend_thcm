export const ARTWORK_TYPES = ["Standard", "Custom", "Language version"] as const;
export const ARTWORK_UNITS = ["px", "mm", "cm", "in", "ft"] as const;
export const ARTWORK_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ARTWORK_MAX_IMAGES = 5;
export const ARTWORK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ArtworkStatus = "REQUESTED" | "LINK_SHARED" | "EDIT_REQUESTED";

/** Local, not-yet-saved request (lives in the CRF form until the CRF is created). */
export type ArtworkDraft = {
  key: string; // client-only id
  productId: string;
  productName: string;
  artworkType: string;
  unit: string;
  width: string;
  height: string;
  label: string;
  description: string;
  files: { file: File; description: string }[];
};

export type ArtworkAttachment = {
  id: string;
  fileName: string;
  description: string | null;
  sizeBytes: number;
  url: string;
};

export type ArtworkEditRound = {
  id: string;
  note: string;
  previousLink: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type ArtworkRequest = {
  id: string;
  productName: string | null;
  artworkType: string;
  unit: string;
  width: number;
  height: number;
  label: string;
  description: string | null;
  status: ArtworkStatus;
  linkUrl: string | null;
  linkSharedAt: string | null;
  lastReminderAt: string | null;
  attachments: ArtworkAttachment[];
  editRounds: ArtworkEditRound[];
};

export type ArtworkListResponse = {
  items: ArtworkRequest[];
  summary: { total: number; withLink: number; pending: number };
  permissions: {
    canAddRequests: boolean;
    canRequestEdit: boolean;
    canSubmitLink: boolean;
    maxEditRounds: number;
  };
};

export type ArtworkQueueGroup = {
  crfId: string;
  epcId: string;
  items: ArtworkRequest[];
};
