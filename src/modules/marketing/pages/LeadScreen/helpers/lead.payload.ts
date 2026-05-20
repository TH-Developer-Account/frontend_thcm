import type { LeadFormRow, LeadPayloadItem, UpdateLeadPayload } from "../types/leads.types";

export const buildLeadPayloadItem = (row: LeadFormRow): LeadPayloadItem => ({
	name: row.leadName.trim(),
	phone: row.leadPhoneNumber.trim(),
	email: row.leadEmail.trim(),
	notes: row.notes?.trim() || "",
});

export const buildUpdateLeadPayload = (epcId: string, row: LeadFormRow): UpdateLeadPayload => ({
	epcId,
	...buildLeadPayloadItem(row),
});
