import * as XLSX from "xlsx";

type TemplateColumn = {
	header: string;
	example: string;
	width?: number;
};

const LEAD_IMPORT_COLUMNS: TemplateColumn[] = [
	{ header: "Name", example: "John Doe", width: 28 },
	{ header: "Email", example: "xyz@gmail.com", width: 24 },
	{ header: "Phone", example: "****9876", width: 22 },
	{ header: "Notes", example: "Cold", width: 28 },
];

const FIELD_GUIDE_COLUMNS: string[][] = [
	["Field", "Format", "Required", "Notes"],
	["Name", "Text", "Yes", "Full name of the lead"],
	["Email", "Email", "Yes", "Must be a valid email address"],
	["Phone", "Text", "No", "10-digit number"],
	["Notes", "Text", "No", "E.g. Cold, Warm, Hot, Sure Shot"],
];

export function downloadLeadImportTemplate() {
	const wb = XLSX.utils.book_new();

	// ── Sheet 1: Import Data ──────────────────────────────────
	const headers = LEAD_IMPORT_COLUMNS.map((c) => c.header);
	const examples = LEAD_IMPORT_COLUMNS.map((c) => c.example);

	const ws = XLSX.utils.aoa_to_sheet([headers, examples]);
	ws["!cols"] = LEAD_IMPORT_COLUMNS.map((c) => ({ wch: c.width ?? 20 }));

	XLSX.utils.book_append_sheet(wb, ws, "Import Data");

	// ── Sheet 2: Field Guide ──────────────────────────────────
	const wsGuide = XLSX.utils.aoa_to_sheet(FIELD_GUIDE_COLUMNS);
	wsGuide["!cols"] = [
		{ wch: 22 }, // Field
		{ wch: 12 }, // Format
		{ wch: 12 }, // Required
		{ wch: 40 }, // Notes
	];

	XLSX.utils.book_append_sheet(wb, wsGuide, "Field Guide");

	// ── Download ──────────────────────────────────────────────
	XLSX.writeFile(wb, "lead-import-template.xlsx");
}
