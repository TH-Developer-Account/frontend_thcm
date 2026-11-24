// hooks/useCppExport.ts — Export PDF / Excel / Text files for one CPP request.
//   PDF           -> GET /pdf/CPP_REQUEST/:id/url        (presigned link, fetched as a blob)
//   Excel         -> GET /cpp/:id/export/excel
//   Text          -> GET /cpp/:id/export/text            (ZINFOUPDATE_ME11)
//   ZCHANGEINFO   -> GET /cpp/:id/export/text?file=changeinfo
// All logic lives here; the page only renders the menu.
import { useCallback, useState } from "react";

import { createPdfApi } from "../../../common/common.api";
import { useToast } from "../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../services/ServerAxios";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

export type CppExportKind = "pdf" | "excel" | "text" | "changeinfo";

const pdfApi = createPdfApi<"CPP_REQUEST">();

const LABELS: Record<CppExportKind, string> = {
	pdf: "PDF",
	excel: "Excel",
	text: "text file",
	changeinfo: "ZCHANGEINFO text file",
};
const EXTENSIONS: Record<CppExportKind, string> = {
	pdf: "pdf",
	excel: "xlsx",
	text: "txt",
	changeinfo: "txt",
};
/** File name prefix for the text downloads, matching the server's SAP file names. */
const FILE_PREFIX: Partial<Record<CppExportKind, string>> = {
	text: "ZINFOUPDATE_ME11",
	changeinfo: "ZCHANGEINFO",
};
/** Server route for each non-PDF export. */
const ENDPOINTS: Record<Exclude<CppExportKind, "pdf">, string> = {
	excel: "export/excel",
	text: "export/text",
	changeinfo: "export/text?file=changeinfo",
};

const triggerDownload = (href: string, fileName: string, newTab = false) => {
	const link = document.createElement("a");
	link.href = href;
	link.download = fileName;
	if (newTab) {
		link.target = "_blank";
		link.rel = "noopener noreferrer";
	}
	document.body.appendChild(link);
	link.click();
	link.remove();
};

const saveBlob = (blob: Blob, fileName: string) => {
	const blobUrl = window.URL.createObjectURL(blob);
	triggerDownload(blobUrl, fileName);
	window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
};

/** Error bodies of blob requests arrive as a Blob — read the server message out of it. */
const blobErrorMessage = async (
	error: unknown,
	fallback: string,
): Promise<string> => {
	const data = (error as { response?: { data?: unknown } })?.response?.data;
	if (data instanceof Blob) {
		try {
			const parsed = JSON.parse(await data.text()) as { message?: string };
			if (parsed.message) return parsed.message;
		} catch {
			/* not JSON — use the generic message */
		}
	}
	return getApiErrorMessage(error, fallback);
};

export const useCppExport = (cppId: string, referenceNumber?: string) => {
	const { showToast } = useToast();
	const [busy, setBusy] = useState<CppExportKind | null>(null);

	const exportAs = useCallback(
		async (kind: CppExportKind) => {
			if (!cppId || busy) return;
			setBusy(kind);
			const ref = referenceNumber ?? cppId;
			const prefix = FILE_PREFIX[kind];
			const fileName = prefix
				? `${prefix}-${ref}.${EXTENSIONS[kind]}`
				: `${ref}.${EXTENSIONS[kind]}`;
			try {
				if (kind === "pdf") {
					const url = await pdfApi.getPdfUrl("CPP_REQUEST", cppId);
					// `download` is ignored for cross-origin signed URLs: fetch the blob
					// first, and fall back to opening the link if CORS blocks it.
					try {
						const response = await fetch(url);
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						saveBlob(await response.blob(), fileName);
					} catch {
						triggerDownload(url, fileName, true);
					}
				} else {
					const { data } = await ServerAxios.get<Blob>(
						`/cpp/${encodeURIComponent(cppId)}/${ENDPOINTS[kind]}`,
						{ responseType: "blob" },
					);
					saveBlob(data, fileName);
				}
			} catch (error) {
				showToast({
					type: "error",
					title: `Could not export ${LABELS[kind]}`,
					description: await blobErrorMessage(
						error,
						`Failed to export the ${LABELS[kind]}.`,
					),
				});
			} finally {
				setBusy(null);
			}
		},
		[busy, cppId, referenceNumber, showToast],
	);

	return { exportAs, exportBusy: busy };
};
