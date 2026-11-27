// modules/audit/shared/checklist/EvidenceCaptureField.tsx
//
// Live-camera evidence capture with MANDATORY location.
//
// This component only captures and displays. Uploading, retrying and
// removing are decided by the parent through onCapture / onRetry /
// onRemove, so a photo is never shown as "uploaded" before the server
// has confirmed it.
//
// Nothing is written to browser storage: captured photos live in memory
// until uploaded.

import React from "react";
import {
	AlertTriangle,
	Camera,
	CheckCircle2,
	Eye,
	Loader2,
	MapPin,
	Plus,
	RefreshCw,
	Trash2,
	WifiOff,
	ZoomIn,
	ZoomOut,
} from "lucide-react";

import { Modal } from "../../../../components/common/Modal";
import { validateUploadFile } from "../../../../components/ui/FileUpload/fileUpload.helpers";
import { AUDIT_EXECUTION_RULES } from "../execution/audit-execution.config";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "../execution/audit-execution.content";
import type { GeoCoordinates, LivePhotoValue } from "./evidence.types";

const text = content.evidence;

// ── Helpers ───────────────────────────────────────────────────────────

function getCurrentPosition(): Promise<GeoCoordinates> {
	return new Promise((resolve, reject) => {
		if (!("geolocation" in navigator)) {
			reject(new Error(text.locationUnsupported));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: position.coords.accuracy,
					capturedAt: new Date().toISOString(),
				}),
			(error) =>
				reject(
					new Error(
						error.code === error.PERMISSION_DENIED
							? text.locationDenied
							: text.locationFailed,
					),
				),
			{
				enableHighAccuracy: true,
				timeout: AUDIT_EXECUTION_RULES.evidence.locationTimeoutMs,
				maximumAge: 0,
			},
		);
	});
}

/** Downscale + re-encode so field uploads stay small on weak networks. */
function compressImage(
	file: File,
	maxDimension: number,
	quality: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		const objectUrl = URL.createObjectURL(file);

		image.onload = () => {
			const scale = Math.min(
				1,
				maxDimension / Math.max(image.width, image.height),
			);
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(image.width * scale);
			canvas.height = Math.round(image.height * scale);
			const context = canvas.getContext("2d");
			if (!context) {
				URL.revokeObjectURL(objectUrl);
				reject(new Error("Canvas not supported"));
				return;
			}
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			canvas.toBlob(
				(blob) => {
					URL.revokeObjectURL(objectUrl);
					if (blob) resolve(blob);
					else reject(new Error("Compression failed"));
				},
				"image/jpeg",
				quality,
			);
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Could not read image"));
		};
		image.src = objectUrl;
	});
}

const formatBytes = (bytes: number): string => {
	const kb = bytes / 1024;
	return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

const formatCoordinates = (location: GeoCoordinates): string =>
	`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

// ── Component ─────────────────────────────────────────────────────────

const ZOOM_STEP = 0.5;
const MAX_ZOOM = 4;
const zoomButton =
	"inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50";

/** Photo viewer: +/- buttons or double-click to zoom, scroll or swipe to pan. */
export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
	const [zoom, setZoom] = React.useState(1);
	React.useEffect(() => setZoom(1), [src]);
	const change = (next: number) =>
		setZoom(Math.min(MAX_ZOOM, Math.max(1, next)));

	return (
		<div className="space-y-2" data-no-swipe>
			<div className="flex items-center justify-end gap-2">
				<button
					type="button"
					className={zoomButton}
					aria-label="Zoom out"
					disabled={zoom <= 1}
					onClick={() => change(zoom - ZOOM_STEP)}
				>
					<ZoomOut className="size-4" aria-hidden="true" />
				</button>
				<button
					type="button"
					className={zoomButton}
					aria-label="Reset zoom"
					onClick={() => change(1)}
				>
					{Math.round(zoom * 100)}%
				</button>
				<button
					type="button"
					className={zoomButton}
					aria-label="Zoom in"
					disabled={zoom >= MAX_ZOOM}
					onClick={() => change(zoom + ZOOM_STEP)}
				>
					<ZoomIn className="size-4" aria-hidden="true" />
				</button>
			</div>
			<div className="h-[65vh] overflow-auto rounded-lg bg-slate-950">
				<img
					src={src}
					alt={alt}
					onDoubleClick={() => change(zoom > 1 ? 1 : 2)}
					className={`max-w-none object-contain ${zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in"}`}
					style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
				/>
			</div>
		</div>
	);
}

export interface EvidenceCaptureFieldProps {
	value: readonly LivePhotoValue[];
	minFiles: number;
	maxFiles: number;
	required?: boolean;
	disabled?: boolean;
	/** Show photos only — no capture, retry or remove. */
	readOnly?: boolean;
	error?: string;
	onCapture: (photo: LivePhotoValue) => void;
	onRetry: (photoId: string) => void;
	onRemove: (photoId: string) => void;
	/** Longest edge after compression. */
	maxDimension?: number;
	/** JPEG quality, 0-1. */
	compressionQuality?: number;
}

export const EvidenceCaptureField = React.memo(function EvidenceCaptureField({
	value,
	minFiles,
	maxFiles,
	required = false,
	disabled = false,
	readOnly = false,
	error,
	onCapture,
	onRetry,
	onRemove,
	maxDimension = 1600,
	compressionQuality = 0.75,
}: EvidenceCaptureFieldProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const inputId = React.useId();
	const errorId = `${inputId}-error`;

	const [isCapturing, setIsCapturing] = React.useState(false);
	const [captureError, setCaptureError] = React.useState<string | null>(null);
	const [previewPhoto, setPreviewPhoto] = React.useState<LivePhotoValue | null>(
		null,
	);
	const [isOnline, setIsOnline] = React.useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	React.useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const canAddMore = value.length < maxFiles;
	const uploadedCount = value.filter(
		(p) => p.uploadStatus === "UPLOADED",
	).length;
	const canCapture = !disabled && !readOnly && canAddMore && !isCapturing;
	const displayedError = error ?? captureError ?? undefined;

	const openCamera = () => {
		if (!canCapture) return;
		setCaptureError(null);
		inputRef.current?.click();
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;

		const invalidMessage = validateUploadFile(file, "image");
		if (invalidMessage) {
			setCaptureError(invalidMessage);
			return;
		}

		// Best-effort "live capture" check; the server must enforce the real rule.
		if (
			Date.now() - file.lastModified >
			AUDIT_EXECUTION_RULES.evidence.maxCaptureAgeMs
		) {
			setCaptureError(text.notLivePhoto);
			return;
		}

		setIsCapturing(true);
		setCaptureError(null);
		try {
			// Location is mandatory: no location, no photo.
			const location = await getCurrentPosition();
			const blob = await compressImage(
				file,
				maxDimension,
				compressionQuality,
			).catch(() => file);
			const name = file.name || `evidence-${Date.now()}.jpg`;
			const prepared = new File([blob], name, { type: blob.type || file.type });

			onCapture({
				id: crypto.randomUUID(),
				file: prepared,
				url: URL.createObjectURL(prepared),
				name,
				type: prepared.type,
				size: prepared.size,
				extension: "jpg",
				sizeLabel: formatBytes(prepared.size),
				isLocal: true,
				caption: "",
				location,
				uploadStatus: "LOCAL",
			});
		} catch (captureFailure) {
			setCaptureError(
				captureFailure instanceof Error
					? captureFailure.message
					: text.locationFailed,
			);
		} finally {
			setIsCapturing(false);
		}
	};

	return (
		<div className="form-field live-photo-upload-field" data-no-swipe>
			{!isOnline ? (
				<p className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-caution-text">
					<WifiOff className="size-3.5" aria-hidden="true" />
					{text.offlineNotice}
				</p>
			) : null}

			{!readOnly ? (
				<>
					<p className="mb-2 text-xs text-fg-secondary">
						{text.permissionHint}
					</p>
					<input
						id={inputId}
						ref={inputRef}
						type="file"
						accept="image/*"
						capture="environment"
						className="file-upload-native-input"
						disabled={disabled}
						aria-invalid={Boolean(displayedError)}
						aria-describedby={displayedError ? errorId : undefined}
						onChange={handleFileChange}
					/>
				</>
			) : null}

			<div className="flex flex-wrap items-center gap-2">
				{!readOnly ? (
					<button
						type="button"
						onClick={openCamera}
						disabled={!canCapture}
						className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-xs font-semibold text-fg-label transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isCapturing ? (
							<Loader2 className="size-4 animate-spin" aria-hidden="true" />
						) : value.length === 0 ? (
							<Camera className="size-4" aria-hidden="true" />
						) : (
							<Plus className="size-4" aria-hidden="true" />
						)}
						{isCapturing
							? text.processing
							: value.length === 0
								? text.takePhoto
								: text.addPhoto}
					</button>
				) : null}

				<span className="text-xs font-medium tabular-nums text-fg-secondary">
					{format(text.counter, { count: uploadedCount, max: maxFiles })}
					{required && uploadedCount < minFiles
						? ` · ${format(text.minimumRequired, { min: minFiles })}`
						: ""}
				</span>
			</div>

			{value.length > 0 ? (
				<ul className="mt-3 flex flex-wrap gap-2">
					{value.map((photo) => (
						<li key={photo.id}>
							<PhotoCard
								photo={photo}
								readOnly={readOnly}
								disabled={disabled}
								onPreview={() => setPreviewPhoto(photo)}
								onRetry={() => onRetry(photo.id)}
								onRemove={() => onRemove(photo.id)}
							/>
						</li>
					))}
				</ul>
			) : null}

			{displayedError ? (
				<p id={errorId} className="form-error-text mt-2" role="alert">
					{displayedError}
				</p>
			) : null}

			<Modal
				open={Boolean(previewPhoto)}
				title={previewPhoto?.name ?? text.previewTitle}
				size="xl"
				onClose={() => setPreviewPhoto(null)}
			>
				{previewPhoto ? (
					<div className="space-y-3">
						<ZoomableImage
							src={previewPhoto.url}
							alt={format(text.photoAlt, { name: previewPhoto.name })}
						/>
						{previewPhoto.location ? (
							<p className="flex items-start gap-1.5 text-xs text-fg-secondary">
								<MapPin
									className="mt-0.5 size-3.5 shrink-0"
									aria-hidden="true"
								/>
								<span className="tabular-nums">
									{formatCoordinates(previewPhoto.location)} ·{" "}
									{new Date(previewPhoto.location.capturedAt).toLocaleString()}
								</span>
							</p>
						) : null}
					</div>
				) : null}
			</Modal>
		</div>
	);
});

// ── Photo card ────────────────────────────────────────────────────────

interface PhotoCardProps {
	photo: LivePhotoValue;
	readOnly: boolean;
	disabled: boolean;
	onPreview: () => void;
	onRetry: () => void;
	onRemove: () => void;
}

const PhotoCard = React.memo(function PhotoCard({
	photo,
	readOnly,
	disabled,
	onPreview,
	onRetry,
	onRemove,
}: PhotoCardProps) {
	const isUploading = photo.uploadStatus === "UPLOADING";
	const isFailed = photo.uploadStatus === "FAILED";
	const isQueued = photo.uploadStatus === "LOCAL";

	return (
		<div className="w-24 sm:w-28">
			<div className="group relative size-24 overflow-hidden rounded-lg border border-line bg-surface-muted sm:size-28">
				<button
					type="button"
					onClick={onPreview}
					className="block size-full overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
					aria-label={format(text.viewPhoto, { name: photo.name })}
				>
					<img
						src={photo.url}
						alt={format(text.photoAlt, { name: photo.name })}
						className="h-full w-full object-cover"
						loading="lazy"
					/>
					<span className="absolute right-1 bottom-1 inline-flex size-6 items-center justify-center rounded-md bg-black/65 text-white">
						<Eye className="size-3.5" aria-hidden="true" />
					</span>
				</button>

				{!readOnly && !disabled && !isUploading ? (
					<button
						type="button"
						className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-md bg-black/65 text-white transition-colors hover:bg-danger-text focus-visible:outline-2 focus-visible:outline-white"
						aria-label={format(text.removePhoto, { name: photo.name })}
						onClick={onRemove}
					>
						<Trash2 className="size-4" aria-hidden="true" />
					</button>
				) : null}

				{isUploading ? (
					<div
						className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30"
						role="progressbar"
						aria-label={text.uploading}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={photo.uploadProgress ?? 0}
					>
						<div
							className="h-full bg-accent transition-[width]"
							style={{ width: `${photo.uploadProgress ?? 0}%` }}
						/>
					</div>
				) : null}
			</div>

			{/* Status is always text + icon, never colour alone. */}
			<p
				className="mt-1 flex items-center gap-1 text-xs font-medium leading-tight"
				aria-live="polite"
			>
				{isUploading ? (
					<>
						<Loader2
							className="size-3 animate-spin text-fg-secondary"
							aria-hidden="true"
						/>
						<span className="text-fg-secondary">{text.uploading}</span>
					</>
				) : isFailed ? (
					<>
						<AlertTriangle
							className="size-3 text-danger-text"
							aria-hidden="true"
						/>
						<span className="text-danger-text">{text.failed}</span>
					</>
				) : isQueued ? (
					<>
						<WifiOff className="size-3 text-caution-text" aria-hidden="true" />
						<span className="text-caution-text">{text.queued}</span>
					</>
				) : (
					<>
						<CheckCircle2
							className="size-3 text-positive-text"
							aria-hidden="true"
						/>
						<span className="text-positive-text">{text.uploaded}</span>
					</>
				)}
			</p>

			{photo.uploadError ? (
				<p
					className="mt-0.5 text-xs leading-tight text-danger-text"
					role="alert"
				>
					{photo.uploadError}
				</p>
			) : null}

			{isFailed && !readOnly && !disabled ? (
				<button
					type="button"
					onClick={onRetry}
					className="mt-1 inline-flex min-h-8 items-center gap-1 rounded border border-line-strong bg-surface px-2 text-xs font-semibold text-fg-label hover:border-accent hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
				>
					<RefreshCw className="size-3" aria-hidden="true" />
					{text.retry}
				</button>
			) : null}
		</div>
	);
});
