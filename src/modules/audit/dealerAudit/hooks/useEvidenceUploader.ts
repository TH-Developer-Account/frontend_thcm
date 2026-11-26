// modules/audit/dealerAudit/hooks/useEvidenceUploader.ts
//
// Evidence workflow for one item: captured photo → upload (with progress)
// → server-confirmed. A photo only counts once the server has confirmed it.
//
// Every state change goes through the draft's functional `updateEvidence`,
// so several photos can upload at once without overwriting each other.

import { useCallback, useEffect, useRef } from "react";

import { revokeFilePreview } from "../../../../components/ui/FileUpload/fileUpload.helpers";
import { auditExecutionContent as content } from "../../shared/execution/audit-execution.content";
import { mapEvidenceToPhoto } from "../../shared/execution/audit-execution.mappers";
import type { LivePhotoValue } from "../../shared/checklist/evidence.types";
import { useDeleteEvidence, useUploadEvidence } from "./useDealerAuditMutations";

interface UseEvidenceUploaderOptions {
	auditId: string;
	itemId: string;
	evidence: readonly LivePhotoValue[];
	updateEvidence: (
		updater: (previous: LivePhotoValue[]) => LivePhotoValue[],
	) => void;
	maxCount: number;
}

export interface EvidenceUploader {
	addCapturedPhoto: (photo: LivePhotoValue) => void;
	retryUpload: (photoId: string) => void;
	removePhoto: (photoId: string) => void;
}

export function useEvidenceUploader({
	auditId,
	itemId,
	evidence,
	updateEvidence,
	maxCount,
}: UseEvidenceUploaderOptions): EvidenceUploader {
	const { mutateAsync: uploadEvidence } = useUploadEvidence();
	const { mutateAsync: deleteEvidence } = useDeleteEvidence();

	const patchPhoto = useCallback(
		(photoId: string, patch: Partial<LivePhotoValue>) => {
			updateEvidence((previous) =>
				previous.map((photo) =>
					photo.id === photoId ? { ...photo, ...patch } : photo,
				),
			);
		},
		[updateEvidence],
	);

	const startUpload = useCallback(
		async (photo: LivePhotoValue): Promise<void> => {
			patchPhoto(photo.id, {
				uploadStatus: "UPLOADING",
				uploadProgress: 0,
				uploadError: undefined,
				pendingSync: false,
			});
			try {
				const saved = await uploadEvidence({
					auditId,
					itemId,
					photo,
					onProgress: (percent) => patchPhoto(photo.id, { uploadProgress: percent }),
				});
				// Swap the local capture for the server-confirmed photo.
				updateEvidence((previous) =>
					previous.map((entry) =>
						entry.id === photo.id ? mapEvidenceToPhoto(saved) : entry,
					),
				);
				if (photo.isLocal) revokeFilePreview(photo);
			} catch {
				patchPhoto(photo.id, {
					uploadStatus: "FAILED",
					uploadProgress: undefined,
					uploadError: content.evidence.uploadFailed,
				});
			}
		},
		[auditId, itemId, patchPhoto, updateEvidence, uploadEvidence],
	);

	const addCapturedPhoto = useCallback(
		(photo: LivePhotoValue) => {
			if (evidence.length >= maxCount) return;
			const offline = typeof navigator !== "undefined" && !navigator.onLine;
			const queued: LivePhotoValue = {
				...photo,
				uploadStatus: "LOCAL",
				pendingSync: offline,
			};
			updateEvidence((previous) => [...previous, queued]);
			// Offline captures wait for the connection instead of failing.
			if (!offline) void startUpload(queued);
		},
		[evidence.length, maxCount, startUpload, updateEvidence],
	);

	const retryUpload = useCallback(
		(photoId: string) => {
			const photo = evidence.find((entry) => entry.id === photoId);
			if (photo) void startUpload(photo);
		},
		[evidence, startUpload],
	);

	const removePhoto = useCallback(
		(photoId: string) => {
			const photo = evidence.find((entry) => entry.id === photoId);
			if (!photo) return;

			const dropLocally = () => {
				updateEvidence((previous) =>
					previous.filter((entry) => entry.id !== photoId),
				);
				if (photo.isLocal) revokeFilePreview(photo);
			};

			if (photo.uploadStatus !== "UPLOADED") {
				dropLocally();
				return;
			}
			// Server-confirmed photos are removed on the server first.
			void deleteEvidence({ auditId, itemId, evidenceId: photoId })
				.then(dropLocally)
				.catch(() =>
					patchPhoto(photoId, { uploadError: content.evidence.deleteFailed }),
				);
		},
		[auditId, deleteEvidence, evidence, itemId, patchPhoto, updateEvidence],
	);

	// Offline captures upload automatically when the connection returns.
	const pendingRef = useRef<readonly LivePhotoValue[]>(evidence);
	useEffect(() => {
		pendingRef.current = evidence;
	}, [evidence]);
	useEffect(() => {
		const handleOnline = () => {
			pendingRef.current
				.filter((photo) => photo.uploadStatus === "LOCAL" && photo.pendingSync)
				.forEach((photo) => void startUpload(photo));
		};
		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [startUpload]);

	return { addCapturedPhoto, retryUpload, removePhoto };
}
