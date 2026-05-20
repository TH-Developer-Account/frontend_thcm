import type { LeadFormRow, LeadValidationErrors } from "../types/leads.types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIA_PHONE_PATTERN = /^(\+91[\s-]?)?[6-9]\d{9}$/;

export const getLeadFieldErrorKey = (field: keyof LeadFormRow, rowId: string) => `${field}-${rowId}`;

export const validateLeadRow = ({
	row,
	rowNumber,
	epcId,
}: {
	row: LeadFormRow;
	rowNumber: number;
	epcId?: string | null;
}): LeadValidationErrors => {
	const errors: LeadValidationErrors = {};

	if (!epcId) errors.form = "EPC reference is missing.";

	if (!row.leadName.trim()) {
		errors[getLeadFieldErrorKey("leadName", row.id)] = `Lead name is required in row ${rowNumber}.`;
	}

	if (!row.leadEmail.trim()) {
		errors[getLeadFieldErrorKey("leadEmail", row.id)] = `Lead email is required in row ${rowNumber}.`;
	} else if (!EMAIL_PATTERN.test(row.leadEmail.trim())) {
		errors[getLeadFieldErrorKey("leadEmail", row.id)] = `Enter a valid email address in row ${rowNumber}.`;
	}

	if (!row.leadPhoneNumber.trim()) {
		errors[getLeadFieldErrorKey("leadPhoneNumber", row.id)] = `Phone number is required in row ${rowNumber}.`;
	} else if (!INDIA_PHONE_PATTERN.test(row.leadPhoneNumber.trim())) {
		errors[getLeadFieldErrorKey("leadPhoneNumber", row.id)] = `Enter a valid phone number in row ${rowNumber}.`;
	}

	return errors;
};

export const clearLeadRowErrors = (errors: LeadValidationErrors, rowId: string) => {
	const next = { ...errors };
	delete next[getLeadFieldErrorKey("leadName", rowId)];
	delete next[getLeadFieldErrorKey("leadEmail", rowId)];
	delete next[getLeadFieldErrorKey("leadPhoneNumber", rowId)];
	return next;
};
