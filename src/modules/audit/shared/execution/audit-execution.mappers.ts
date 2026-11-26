// modules/audit/shared/execution/audit-execution.mappers.ts
//
// Shape conversions that do not depend on a module's API contract.

import {
	formatFileSize,
	getFileExtension,
} from "../../../../components/ui/FileUpload/fileUpload.helpers";
import type { LivePhotoValue } from "../checklist/evidence.types";
import type { AuditItemEvidence } from "./audit-execution.types";

/** Server evidence → an already-UPLOADED photo for the capture field. */
export const mapEvidenceToPhoto = (
	evidence: AuditItemEvidence,
): LivePhotoValue => ({
	id: evidence.id,
	file: null,
	url: evidence.url,
	name: evidence.fileName,
	type: evidence.mimeType ?? "image/jpeg",
	size: evidence.sizeBytes ?? 0,
	extension: getFileExtension(evidence.fileName),
	sizeLabel: formatFileSize(evidence.sizeBytes),
	isLocal: false,
	caption: "",
	location: {
		latitude: evidence.latitude,
		longitude: evidence.longitude,
		accuracy: evidence.accuracyMeters ?? undefined,
		capturedAt: evidence.capturedAt,
	},
	uploadStatus: "UPLOADED",
});
