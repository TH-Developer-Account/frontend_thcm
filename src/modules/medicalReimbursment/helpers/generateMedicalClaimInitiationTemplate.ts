import * as XLSX from "xlsx";

type TemplateColumn = {
	header: string;
	example: string;
	width: number;
};

const MEDICAL_INITIATION_IMPORT_COLUMNS: TemplateColumn[] = [
	{
		header: "employeeName",
		example: "Rahul Sharma",
		width: 28,
	},
	{
		header: "ticketNumber",
		example: "1234",
		width: 16,
	},
	{
		header: "email",
		example: "rahul.sharma@example.com",
		width: 32,
	},
	{
		header: "mobile",
		example: "9876543210",
		width: 20,
	},
];

const FIELD_GUIDE_ROWS: string[][] = [
	["Field", "Format", "Required", "Description"],
	["employeeName", "Text", "Yes", "Full name of the employee"],
	["ticketNumber", "Text", "Yes", "Employee grade"],
	["email", "Email", "Yes", "Valid employee email address"],
	[
		"mobile",
		"Text",
		"Yes",
		"10-digit phone number without spaces or country code",
	],
];

export function downloadMedicalClaimInitiationTemplate() {
	const workbook = XLSX.utils.book_new();

	const headers = MEDICAL_INITIATION_IMPORT_COLUMNS.map(
		(column) => column.header,
	);
	const exampleRow = MEDICAL_INITIATION_IMPORT_COLUMNS.map(
		(column) => column.example,
	);

	const importSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

	importSheet["!cols"] = MEDICAL_INITIATION_IMPORT_COLUMNS.map((column) => ({
		wch: column.width,
	}));

	XLSX.utils.book_append_sheet(workbook, importSheet, "Medical Initiations");

	const guideSheet = XLSX.utils.aoa_to_sheet(FIELD_GUIDE_ROWS);

	guideSheet["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 52 }];

	XLSX.utils.book_append_sheet(workbook, guideSheet, "Field Guide");

	XLSX.writeFile(workbook, "medical-claim-initiation-template.xlsx");
}
