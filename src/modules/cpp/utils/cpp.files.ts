// utils/cpp.files.ts — download a saved CPP file under its own name.
// Attachments come with a signed S3 URL. The `download` attribute is ignored for
// cross-origin links, so the file is fetched as a blob first; when the bucket's
// CORS blocks that, the link opens in a new tab instead (the browser still saves it).
// Signed URLs expire (1 h): a page left open longer must be refreshed first.

export type DownloadableFile = { name: string; url?: string | null };

export const canDownload = (file: DownloadableFile | null | undefined) =>
	Boolean(file?.url);

export const downloadCppFile = async (file: DownloadableFile): Promise<void> => {
	if (!file.url) return;
	try {
		const response = await fetch(file.url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const objectUrl = URL.createObjectURL(await response.blob());
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = file.name || "download";
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
	} catch {
		window.open(file.url, "_blank", "noopener,noreferrer");
	}
};
