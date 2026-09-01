import type {
	LeadFormRow,
	LeadPayloadItem,
	UpdateLeadPayload,
} from "../types/leads.types";

export const buildLeadPayloadItem = (row: LeadFormRow): LeadPayloadItem => ({
	name: row.leadName.trim(),
	phone: row.leadPhoneNumber.trim(),
	email: row.leadEmail.trim(),
	notes: row.notes?.trim() || "",
});

export const buildUpdateLeadPayload = (
	epcId: string,
	row: LeadFormRow,
): UpdateLeadPayload => ({
	epcId,
	...buildLeadPayloadItem(row),
});
// wherever you handle the uploaded file
export function parseLeadImport(rows: Record<string, string>[]) {
	const EXPECTED_HEADERS = [
		"Lead Name",
		"Lead Email",
		"Lead Phone Number",
		"Notes",
	] as const;

	const uploadedHeaders = Object.keys(rows[0] ?? {});
	const missing = EXPECTED_HEADERS.filter((h) => !uploadedHeaders.includes(h));

	if (missing.length) {
		throw new Error(`Missing columns: ${missing.join(", ")}`);
	}

	return rows.map((row) => ({
		name: row["Lead Name"],
		email: row["Lead Email"],
		phoneNumber: row["Lead Phone Number"],
		notes: row["Notes"],
	}));
}
