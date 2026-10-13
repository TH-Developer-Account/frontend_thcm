import * as XLSX from "xlsx";

import { INITIATION_IMPORT_COLUMNS } from "./initiationImport.parser";

type TemplateColumn = {
	header: string;
	example: string;
	width: number;
};

const EXAMPLES: Record<string, Omit<TemplateColumn, "header">> = {
	employeeName: { example: "Rahul Sharma", width: 28 },
	ticketNumber: { example: "RE10214", width: 16 },
	email: { example: "rahul.sharma@example.com", width: 32 },
	mobile: { example: "9876543210", width: 20 },
};

export const MEDICAL_INITIATION_IMPORT_COLUMNS: TemplateColumn[] =
	INITIATION_IMPORT_COLUMNS.map((header) => ({ header, ...EXAMPLES[header] }));

const FIELD_GUIDE_ROWS: string[][] = [
	["Field", "Format", "Required", "Description"],
	[
		"employeeName",
		"Text",
		"Yes",
		"Full name of the retired employee (letters, spaces and . ' - only)",
	],
	[
		"ticketNumber",
		"Text",
		"Yes",
		"Retiree code / ticket number, e.g. RE10214 (letters, numbers, hyphen). Used to look up grade and eligibility.",
	],
	["email", "Email", "Yes", "Valid email address — the claim form link is sent here"],
	[
		"mobile",
		"Text",
		"Yes",
		"10-digit Indian mobile number starting with 6-9, without spaces or +91",
	],
	["", "", "", ""],
	["Notes", "", "", "Keep row 1 as the header row. One employee per row; duplicates are rejected."],
];

export function downloadMedicalClaimInitiationTemplate() {
	const workbook = XLSX.utils.book_new();

	const importSheet = XLSX.utils.aoa_to_sheet([
		MEDICAL_INITIATION_IMPORT_COLUMNS.map((column) => column.header),
		MEDICAL_INITIATION_IMPORT_COLUMNS.map((column) => column.example),
	]);
	importSheet["!cols"] = MEDICAL_INITIATION_IMPORT_COLUMNS.map((column) => ({
		wch: column.width,
	}));
	// Keep mobile/ticket as text so Excel doesn't drop leading characters.
	["B2", "D2"].forEach((cell) => {
		if (importSheet[cell]) importSheet[cell].t = "s";
	});
	XLSX.utils.book_append_sheet(workbook, importSheet, "Medical Initiations");

	const guideSheet = XLSX.utils.aoa_to_sheet(FIELD_GUIDE_ROWS);
	guideSheet["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 72 }];
	XLSX.utils.book_append_sheet(workbook, guideSheet, "Field Guide");

	XLSX.writeFile(workbook, "medical-claim-initiation-template.xlsx");
}
