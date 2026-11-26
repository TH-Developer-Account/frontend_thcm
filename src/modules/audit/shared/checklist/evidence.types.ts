// modules/audit/shared/checklist/evidence.types.ts
//
// Evidence shapes shared by the capture field, the item draft hooks and the
// mappers. Kept in its own file so the domain types can reference them
// without importing a React component.

import type { FileUploadValue } from "../../../../components/ui/FileUpload/fileUpload.types";

/**
 * LOCAL      captured on this device, not sent to the server yet
 * UPLOADING  request in flight
 * UPLOADED   server confirmed (only these count as evidence)
 * FAILED     upload failed, user can retry or remove
 */
export type EvidenceUploadStatus =
	| "LOCAL"
	| "UPLOADING"
	| "UPLOADED"
	| "FAILED";

export type GeoCoordinates = {
	latitude: number;
	longitude: number;
	accuracy?: number;
	capturedAt: string; // ISO timestamp
};

/** Editable (draft) shape of one evidence photo. */
export type LivePhotoValue = Omit<FileUploadValue, "id"> & {
	id: string;
	/** Mandatory for audit evidence (see AUDIT_EXECUTION_RULES.evidence). */
	location?: GeoCoordinates;
	locationLabel?: string;
	/** true while the item sits in the offline queue, unsent. */
	pendingSync?: boolean;
	uploadStatus: EvidenceUploadStatus;
	/** 0-100, only meaningful while UPLOADING. */
	uploadProgress?: number;
	uploadError?: string;
};
