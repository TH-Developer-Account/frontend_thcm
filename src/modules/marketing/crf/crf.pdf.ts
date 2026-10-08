// crf/crf.pdf.ts
// Element → A4 PDF download, using html2pdf.js (already used by the event
// report preview). Loaded on demand so it isn't in the main bundle.

type Html2PdfOptions = {
	margin?: number | number[];
	filename?: string;
	image?: { type: "jpeg" | "png" | "webp"; quality: number };
	html2canvas?: { scale?: number; useCORS?: boolean; backgroundColor?: string; logging?: boolean };
	jsPDF?: { unit?: "mm" | "pt"; format?: string; orientation?: "portrait" | "landscape" };
	pagebreak?: { mode?: Array<"avoid-all" | "css" | "legacy">; avoid?: string | string[] };
};

/** html2pdf() returns a fluent worker (some typings say Promise<void>). */
type Html2PdfWorker = {
	set(options: Html2PdfOptions): Html2PdfWorker;
	from(source: HTMLElement): Html2PdfWorker;
	save(): Promise<void>;
};

export const sanitizeFileName = (value: string, fallback = "document") =>
	value
		.trim()
		.replace(/[<>:"/\\|?*]/g, "-")
		.replace(/\s+/g, " ")
		.replace(/[.\s]+$/g, "") || fallback;

export async function downloadElementAsPdf(element: HTMLElement, fileName: string) {
	const module = await import("html2pdf.js");
	const html2pdf = ((module as { default?: unknown }).default ?? module) as () => Html2PdfWorker;

	document.body.classList.add("pdf-export-mode");
	try {
		await html2pdf()
			.set({
				margin: [10, 10, 10, 10],
				filename: `${sanitizeFileName(fileName)}.pdf`,
				image: { type: "jpeg", quality: 0.98 },
				html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".crf-dn-avoid-break"] },
			})
			.from(element)
			.save();
	} finally {
		document.body.classList.remove("pdf-export-mode");
	}
}
