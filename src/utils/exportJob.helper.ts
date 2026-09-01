import type { ExportJobStatus } from "../api/common.api";

export type ExportState =
	| { status: "idle" }
	| { status: "pending" }
	| { status: "delayed" }
	| { status: "ready"; downloadUrl: string }
	| { status: "error"; message: string };

export async function pollExportJob(
	fetchStatus: (jobId: string) => Promise<ExportJobStatus>,
	jobId: string,
	{
		maxAttempts = 20,
		initialDelayMs = 1500,
		maxDelayMs = 8000,
	}: {
		maxAttempts?: number;
		initialDelayMs?: number;
		maxDelayMs?: number;
	} = {},
): Promise<string> {
	let delay = initialDelayMs;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const result = await fetchStatus(jobId);

		if (result.status === "completed" && result.downloadUrl) {
			return result.downloadUrl;
		}
		if (result.status === "failed") {
			throw new Error("Export job failed.");
		}

		await new Promise((resolve) => setTimeout(resolve, delay));
		delay = Math.min(delay * 1.5, maxDelayMs);
	}

	throw new Error("Export job timed out.");
}

// Kept for flows that still need an authenticated/blob download (e.g. exportOne).
export async function downloadBlobFromUrl(
	downloadUrl: string,
	fetchBlob: (url: string) => Promise<Blob>,
	filename: string,
): Promise<void> {
	const blob = await fetchBlob(downloadUrl);
	const blobUrl = window.URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();

	window.URL.revokeObjectURL(blobUrl);
}

// New: plain browser GET navigation — no fetch, no CORS involved.
export function navigateToDownloadUrl(downloadUrl: string): void {
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.rel = "noopener";
	// Note: `download` attribute is ignored by browsers for cross-origin
	// URLs (like S3), so the file will open/save per the bucket's
	// Content-Disposition header rather than a forced filename here.
	document.body.appendChild(link);
	link.click();
	link.remove();
}
