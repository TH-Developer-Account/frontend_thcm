import React from "react";
import {
	Camera,
	CloudOff,
	Eye,
	MapPin,
	Plus,
	Trash2,
	WifiOff,
} from "lucide-react";

import {
	revokeFilePreview,
	validateUploadFile,
} from "../../../../components/ui/FileUpload/fileUpload.helpers";
import type { FileUploadValue } from "../../../../components/ui/FileUpload/fileUpload.types";
import { Modal } from "../../../../components/common/Modal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type GeoCoordinates = {
	latitude: number;
	longitude: number;
	accuracy?: number;
	capturedAt: string; // ISO timestamp
};

export type LivePhotoValue = Omit<FileUploadValue, "id"> & {
	id: string;
	location?: GeoCoordinates;
	locationLabel?: string;
	/** true while this item is sitting in the offline queue, unsent */
	pendingSync?: boolean;
};

export type ReverseGeocodeFn = (lat: number, lng: number) => Promise<string>;

export type LivePhotoUploadFieldProps = {
	label?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	minFiles?: number;
	maxFiles?: number;
	value: LivePhotoValue[];
	onChange: (value: LivePhotoValue[]) => void;
	/**
	 * Injected geocoder — keep the component dependency-free.
	 * In production this should call your own backend proxy, not a
	 * third-party geocoding API directly from the client.
	 */
	reverseGeocode?: ReverseGeocodeFn;
	/** Max longest-edge dimension for client-side compression. Default 1600. */
	maxDimension?: number;
	/** JPEG quality 0-1 for client-side compression. Default 0.75. */
	compressionQuality?: number;
};

/* ------------------------------------------------------------------ */
/*  Offline queue — thin IndexedDB wrapper                             */
/*                                                                     */
/*  Kept isolated behind a tiny interface so the rest of the           */
/*  component never touches IndexedDB directly. This is the seam       */
/*  where real background sync (Workbox / service worker) plugs in     */
/*  later without touching component logic.                            */
/* ------------------------------------------------------------------ */

const DB_NAME = "live-photo-upload-queue";
const STORE_NAME = "pending-uploads";

type QueuedPhoto = {
	id: string;
	blob: Blob;
	name: string;
	location?: GeoCoordinates;
	queuedAt: string;
};

function openQueueDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "id" });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function queuePhoto(item: QueuedPhoto): Promise<void> {
	const db = await openQueueDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).put(item);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

async function listQueuedPhotos(): Promise<QueuedPhoto[]> {
	const db = await openQueueDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly");
		const request = tx.objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve(request.result as QueuedPhoto[]);
		request.onerror = () => reject(request.error);
	});
}

async function removeQueuedPhoto(id: string): Promise<void> {
	const db = await openQueueDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/* ------------------------------------------------------------------ */
/*  Geolocation + compression helpers                                  */
/* ------------------------------------------------------------------ */

function getCurrentPosition(
	options?: PositionOptions,
): Promise<GeoCoordinates> {
	return new Promise((resolve, reject) => {
		if (!("geolocation" in navigator)) {
			reject(new Error("Geolocation is not supported on this device."));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
					capturedAt: new Date().toISOString(),
				}),
			(err) => reject(err),
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options },
		);
	});
}

/**
 * Downscale + re-encode a captured photo before it ever enters the
 * upload pipeline. Camera captures on modern phones commonly run
 * 3–8MB; this keeps bundle/network cost sane for a wrapped mobile app.
 */
function compressImage(
	file: File,
	maxDimension: number,
	quality: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const objectUrl = URL.createObjectURL(file);

		img.onload = () => {
			const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(img.width * scale);
			canvas.height = Math.round(img.height * scale);

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				URL.revokeObjectURL(objectUrl);
				reject(new Error("Canvas not supported"));
				return;
			}
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

		img.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Could not read image"));
		};

		img.src = objectUrl;
	});
}

function formatBytes(bytes?: number): string {
	if (!bytes) return "";
	const kb = bytes / 1024;
	return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function formatCoords(loc: GeoCoordinates): string {
	return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const LivePhotoUploadField = React.memo(
	({
		label = "",
		description,
		required = false,
		disabled = false,
		error,
		minFiles = 2,
		maxFiles = 5,
		value,
		onChange,
		reverseGeocode,
		maxDimension = 1600,
		compressionQuality = 0.75,
	}: LivePhotoUploadFieldProps) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		const inputId = React.useId();
		const errorId = `${inputId}-error`;

		const [isCapturing, setIsCapturing] = React.useState(false);
		const [captureError, setCaptureError] = React.useState<string | null>(null);
		const [isOnline, setIsOnline] = React.useState(
			typeof navigator === "undefined" ? true : navigator.onLine,
		);
		const [queuedCount, setQueuedCount] = React.useState(0);
		const [previewPhoto, setPreviewPhoto] =
			React.useState<LivePhotoValue | null>(null);

		const canAddMore = value.length < maxFiles;
		const hasPhotos = value.length > 0;

		/* -- online/offline tracking -- */
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

		/* -- surface queue depth on mount + whenever we queue something -- */
		const refreshQueueCount = React.useCallback(async () => {
			try {
				const queued = await listQueuedPhotos();
				setQueuedCount(queued.length);
			} catch {
				// IndexedDB unavailable (private browsing, unsupported) — degrade
				// silently; offline queueing simply won't be available.
			}
		}, []);

		React.useEffect(() => {
			refreshQueueCount();
		}, [refreshQueueCount]);

		/* -- cleanup object URLs on unmount -- */
		const valueRef = React.useRef(value);
		React.useEffect(() => {
			valueRef.current = value;
		}, [value]);
		React.useEffect(() => {
			return () => {
				valueRef.current.forEach((item) => revokeFilePreview(item));
			};
		}, []);

		const openCamera = React.useCallback(() => {
			if (disabled || !canAddMore) return;
			setCaptureError(null);
			inputRef.current?.click();
		}, [disabled, canAddMore]);

		const attachLocationLabel = React.useCallback(
			async (itemId: string, location: GeoCoordinates) => {
				if (!reverseGeocode) return;
				try {
					const label = await reverseGeocode(
						location.latitude,
						location.longitude,
					);
					onChange(
						valueRef.current.map((item) =>
							item.id === itemId ? { ...item, locationLabel: label } : item,
						),
					);
				} catch {
					// Reverse geocoding is a nice-to-have — raw coordinates are
					// already attached and remain the source of truth.
				}
			},
			[onChange, reverseGeocode],
		);

		const handleFileChange = React.useCallback(
			async (event: React.ChangeEvent<HTMLInputElement>) => {
				const file = event.target.files?.[0];
				event.target.value = "";
				if (!file) return;

				const invalidMessage = validateUploadFile(file, "image");
				if (invalidMessage) {
					setCaptureError(invalidMessage);
					return;
				}

				setIsCapturing(true);
				setCaptureError(null);

				try {
					// Kick off compression and location capture together —
					// neither should block on the other.
					const [compressedBlob, location] = await Promise.all([
						compressImage(file, maxDimension, compressionQuality).catch(
							() => file, // fall back to original if compression fails
						),
						getCurrentPosition().catch((err) => {
							// A denied/failed location shouldn't block the photo itself.
							setCaptureError(
								`Photo captured, but location wasn't available (${err.message}).`,
							);
							return undefined;
						}),
					]);

					const id = `${file.name}-${Date.now()}`;
					const previewUrl = URL.createObjectURL(compressedBlob);

					const nextItem: LivePhotoValue = {
						id,
						name: file.name,
						size: compressedBlob.size,
						sizeLabel: formatBytes(compressedBlob.size),
						url: previewUrl,
						isLocal: true,
						location,
						pendingSync: !isOnline,
					} as LivePhotoValue;

					if (!isOnline) {
						// Offline: park the compressed blob in IndexedDB rather than
						// attempting (and failing) a network upload. A separate sync
						// process — a service worker or an effect watching `online` —
						// is responsible for draining this queue and swapping
						// `pendingSync` off once the real upload succeeds.
						await queuePhoto({
							id,
							blob: compressedBlob,
							name: file.name,
							location,
							queuedAt: new Date().toISOString(),
						});
						await refreshQueueCount();
					}

					onChange([...value, nextItem]);

					if (location) {
						attachLocationLabel(id, location);
					}
				} finally {
					setIsCapturing(false);
				}
			},
			[
				attachLocationLabel,
				compressionQuality,
				isOnline,
				maxDimension,
				onChange,
				refreshQueueCount,
				value,
			],
		);

		const handleRemove = React.useCallback(
			async (item: LivePhotoValue) => {
				if (item.isLocal) revokeFilePreview(item);
				if (item.pendingSync) {
					await removeQueuedPhoto(item.id ?? "");
					await refreshQueueCount();
				}
				onChange(value.filter((v) => v.id !== item.id));
			},
			[onChange, refreshQueueCount, value],
		);

		return (
			<div className="form-field live-photo-upload-field">
				{label || !isOnline ? (
					<div className="form-label-row flex items-center justify-between">
						{label ? (
							<label htmlFor={inputId} className="form-label">
								{label}
								{required ? <span className="form-required"> *</span> : null}
							</label>
						) : (
							<span />
						)}

						{!isOnline ? (
							<span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
								<WifiOff className="size-3.5" aria-hidden="true" />
								Offline — photos will queue
							</span>
						) : null}
					</div>
				) : null}

				{description ? (
					<p className="text-xs text-slate-500 mb-2">{description}</p>
				) : null}

				<input
					id={inputId}
					ref={inputRef}
					type="file"
					accept="image/*"
					capture="environment"
					className="file-upload-native-input"
					disabled={disabled}
					aria-invalid={Boolean(error || captureError)}
					aria-describedby={error || captureError ? errorId : undefined}
					onChange={handleFileChange}
				/>

				<div className="flex flex-wrap items-center gap-2">
					{!hasPhotos ? (
						<button
							type="button"
							onClick={openCamera}
							disabled={disabled || isCapturing}
							className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Camera className="size-4" aria-hidden="true" />
							{isCapturing ? "Processing…" : "Take photo"}
						</button>
					) : canAddMore ? (
						<button
							type="button"
							onClick={openCamera}
							disabled={disabled || isCapturing}
							className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Plus className="size-3.5" aria-hidden="true" />
							{isCapturing ? "Processing…" : "Add photo"}
						</button>
					) : null}

					<span className="text-xs text-slate-500">
						{value.length}/{maxFiles} photos
						{required && value.length < minFiles
							? ` · minimum ${minFiles} required`
							: ""}
					</span>
				</div>

				{value.length > 0 ? (
					<div className="mt-3 flex max-w-xl flex-wrap gap-2">
						{value.map((item) => (
							<LivePhotoCard
								key={item.id}
								item={item}
								disabled={disabled}
								onPreview={() => setPreviewPhoto(item)}
								onRemove={() => handleRemove(item)}
							/>
						))}
					</div>
				) : null}

				{queuedCount > 0 ? (
					<p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
						<CloudOff className="size-3.5" aria-hidden="true" />
						{queuedCount} photo{queuedCount === 1 ? "" : "s"} waiting to sync
					</p>
				) : null}

				{error || captureError ? (
					<p id={errorId} className="form-error-text" role="alert">
						{error ?? captureError}
					</p>
				) : null}

				<Modal
					open={Boolean(previewPhoto)}
					title={previewPhoto?.name ?? "Photo preview"}
					size="xl"
					onClose={() => setPreviewPhoto(null)}
				>
					{previewPhoto ? (
						<div className="space-y-3">
							<img
								src={previewPhoto.url}
								alt={previewPhoto.name}
								className="max-h-[75vh] w-full rounded-lg bg-slate-950 object-contain"
							/>
							{previewPhoto.location ? (
								<p className="flex items-start gap-1.5 text-xs text-slate-600">
									<MapPin
										className="mt-0.5 size-3.5 shrink-0"
										aria-hidden="true"
									/>
									<span>
										{previewPhoto.locationLabel ?? "Location captured"} ·{" "}
										{formatCoords(previewPhoto.location)}
									</span>
								</p>
							) : null}
						</div>
					) : null}
				</Modal>
			</div>
		);
	},
);

LivePhotoUploadField.displayName = "LivePhotoUploadField";

/* ------------------------------------------------------------------ */
/*  Preview card                                                       */
/* ------------------------------------------------------------------ */

type LivePhotoCardProps = {
	item: LivePhotoValue;
	disabled: boolean;
	onPreview: () => void;
	onRemove: () => void;
};

const LivePhotoCard = React.memo(
	({ item, disabled, onPreview, onRemove }: LivePhotoCardProps) => {
		return (
			<div className="group relative size-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:size-28">
				<button
					type="button"
					onClick={onPreview}
					className="block size-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
					aria-label={`View ${item.name} full size`}
				>
					<img
						src={item.url}
						alt={item.name}
						className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
						loading="lazy"
					/>
					<span className="absolute right-1 bottom-1 inline-flex size-6 items-center justify-center rounded-md bg-black/65 text-white">
						<Eye className="size-3.5" aria-hidden="true" />
					</span>
					{item.pendingSync ? (
						<span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
							<CloudOff className="size-3" aria-hidden="true" />
							Queued
						</span>
					) : null}
				</button>

				{!disabled ? (
					<button
						type="button"
						className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-md bg-black/65 text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
						aria-label={`Remove ${item.name}`}
						onClick={onRemove}
					>
						<Trash2 className="size-3.5" aria-hidden="true" />
					</button>
				) : null}
			</div>
		);
	},
);

LivePhotoCard.displayName = "LivePhotoCard";
