import * as XLSX from "xlsx";

import type {
	MedicalClaimInitiationPayload,
	ParsedInitiationFile,
	ParsedInitiationRow,
} from "../types/medicalClaimInitiation.types";
import { medicalClaimInitiationSchema } from "../utils/reimbursementClaim.schemas";

/**
 * Browser-side parsing + validation of the bulk-initiation spreadsheet.
 *
 * The backend validates again (and is the authority), but checking here lets
 * HR fix the sheet BEFORE anything is created or emailed: each row is
 * validated with the same zod schema as the single-initiation form, plus
 * duplicate detection inside the file.
 */

export const MAX_IMPORT_ROWS = 1000;

export const INITIATION_IMPORT_COLUMNS: Array<keyof MedicalClaimInitiationPayload> = [
	"employeeName",
	"ticketNumber",
	"email",
	"mobile",
];

const HEADER_ALIASES: Record<keyof MedicalClaimInitiationPayload, string[]> = {
	employeeName: ["employeename", "name", "fullname"],
	ticketNumber: ["ticketnumber", "ticketno", "ticket", "retireecode", "employeecode"],
	email: ["email", "employeeemail", "emailaddress"],
	mobile: ["mobile", "phone", "phonenumber", "mobilenumber", "employeephonenumber"],
};

const normaliseHeader = (header: string) =>
	header.toLowerCase().replace(/[\s_\-*]+/g, "");

export const COLUMN_LABELS: Record<keyof MedicalClaimInitiationPayload, string> = {
	employeeName: "Employee Name",
	ticketNumber: "Ticket Number",
	email: "Email",
	mobile: "Mobile",
};

/** Maps a sheet header row to our canonical fields. */
export function resolveColumns(headers: string[]) {
	const byField = {} as Record<keyof MedicalClaimInitiationPayload, string | undefined>;
	for (const field of INITIATION_IMPORT_COLUMNS) {
		byField[field] = headers.find((header) =>
			HEADER_ALIASES[field].includes(normaliseHeader(header)),
		);
	}
	const missing = INITIATION_IMPORT_COLUMNS.filter((field) => !byField[field]);
	return { byField, missing };
}

const cellToString = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	// Excel stores phone numbers as numbers: 9876543210 → "9876543210".
	if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
	return String(value).trim();
};

/** Validates already-extracted rows. Pure — unit-tested. */
export function validateInitiationRows(
	records: Array<Record<string, unknown>>,
	headers: string[],
	fileName = "import.xlsx",
): ParsedInitiationFile {
	const fileErrors: string[] = [];
	const { byField, missing } = resolveColumns(headers);

	if (missing.length) {
		fileErrors.push(
			`Missing column(s): ${missing.map((field) => COLUMN_LABELS[field]).join(", ")}. Download the template and keep its header row.`,
		);
	}

	const nonEmpty = records.filter((record) =>
		Object.values(record).some((value) => cellToString(value) !== ""),
	);
	if (!nonEmpty.length && !missing.length) {
		fileErrors.push("The file has no data rows.");
	}
	if (nonEmpty.length > MAX_IMPORT_ROWS) {
		fileErrors.push(
			`The file has ${nonEmpty.length} rows. Import at most ${MAX_IMPORT_ROWS} rows at a time.`,
		);
	}

	if (fileErrors.length) {
		return { fileName, rows: [], validCount: 0, invalidCount: 0, fileErrors };
	}

	const seenEmail = new Map<string, number>();
	const seenMobile = new Map<string, number>();
	const seenTicket = new Map<string, number>();

	const rows: ParsedInitiationRow[] = [];
	records.forEach((record, index) => {
		if (!Object.values(record).some((value) => cellToString(value) !== "")) return;
		const rowNumber = index + 2; // header is row 1

		const values: MedicalClaimInitiationPayload = {
			employeeName: cellToString(record[byField.employeeName!]),
			ticketNumber: cellToString(record[byField.ticketNumber!]),
			email: cellToString(record[byField.email!]),
			mobile: cellToString(record[byField.mobile!]),
		};

		const errors: ParsedInitiationRow["errors"] = {};
		const result = medicalClaimInitiationSchema.safeParse(values);
		if (!result.success) {
			for (const issue of result.error.issues) {
				const key = String(issue.path[0]) as keyof MedicalClaimInitiationPayload;
				if (!errors[key]) errors[key] = issue.message;
			}
		}

		const normalised = result.success ? result.data : values;
		if (result.success) {
			const dupEmail = seenEmail.get(normalised.email);
			const dupMobile = seenMobile.get(normalised.mobile);
			const dupTicket = seenTicket.get(normalised.ticketNumber.toUpperCase());
			if (dupEmail) errors.email = `Duplicate of row ${dupEmail}.`;
			if (dupMobile) errors.mobile = `Duplicate of row ${dupMobile}.`;
			if (dupTicket) errors.ticketNumber = `Duplicate of row ${dupTicket}.`;
			if (!dupEmail) seenEmail.set(normalised.email, rowNumber);
			if (!dupMobile) seenMobile.set(normalised.mobile, rowNumber);
			if (!dupTicket) seenTicket.set(normalised.ticketNumber.toUpperCase(), rowNumber);
		}

		const isValid = Object.keys(errors).length === 0;
		rows.push({ row: rowNumber, values: normalised, errors, isValid });
	});

	const validCount = rows.filter((row) => row.isValid).length;
	return {
		fileName,
		rows,
		validCount,
		invalidCount: rows.length - validCount,
		fileErrors,
	};
}

export async function parseInitiationImportFile(file: File): Promise<ParsedInitiationFile> {
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
	} catch {
		return {
			fileName: file.name,
			rows: [],
			validCount: 0,
			invalidCount: 0,
			fileErrors: ["This file could not be read. Upload an .xlsx, .xls or .csv file."],
		};
	}

	const sheetName = workbook.SheetNames[0];
	const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
	if (!sheet) {
		return {
			fileName: file.name,
			rows: [],
			validCount: 0,
			invalidCount: 0,
			fileErrors: ["The workbook has no sheets."],
		};
	}

	const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
		header: 1,
		defval: "",
		raw: true,
		blankrows: true,
	});
	const headers = (matrix[0] ?? []).map((cell) => cellToString(cell));
	const records = matrix.slice(1).map((cells) => {
		const record: Record<string, unknown> = {};
		headers.forEach((header, index) => {
			record[header] = cells?.[index] ?? "";
		});
		return record;
	});

	return validateInitiationRows(records, headers, file.name);
}

/**
 * Builds a clean upload file containing only valid rows, with canonical
 * headers — so the server never sees rows the user already chose to skip.
 */
export function buildInitiationImportFile(
	rows: ParsedInitiationRow[],
	originalName = "medical-claim-initiations.xlsx",
): File {
	const valid = rows.filter((row) => row.isValid);
	const sheet = XLSX.utils.aoa_to_sheet([
		INITIATION_IMPORT_COLUMNS,
		...valid.map((row) => INITIATION_IMPORT_COLUMNS.map((field) => row.values[field])),
	]);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, "Medical Initiations");
	const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
	const name = originalName.replace(/\.(xlsx|xls|csv)$/i, "") + ".xlsx";
	return new File([buffer], name, {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}
