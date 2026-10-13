import type {
  LeadFormFieldKey,
  LeadFormRow,
  LeadValidationErrors,
} from "../types/leads.types";

import { FORM_FIELD_TO_CONFIG_KEY } from "./lead.fieldConfig";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIA_PHONE_PATTERN = /^(\+91[\s-]?)?[6-9]\d{9}$/;

export const getLeadFieldErrorKey = (field: keyof LeadFormRow, rowId: string) =>
  `${field}-${rowId}`;

const isFieldVisible = (
  formField: keyof Omit<LeadFormRow, "id">,
  fields: LeadFormFieldKey[],
): boolean => {
  const configKey = FORM_FIELD_TO_CONFIG_KEY[formField];
  return configKey ? fields.includes(configKey) : false;
};

export const validateLeadRow = ({
  row,
  rowNumber,
  epcId,
  fields,
}: {
  row: LeadFormRow;
  rowNumber: number;
  epcId?: string | null;
  fields: LeadFormFieldKey[];
}): LeadValidationErrors => {
  const errors: LeadValidationErrors = {};

  if (!epcId) errors.form = "EPC reference is missing.";

  // name is always required, in every variant.
  if (!row.leadName.trim()) {
    errors[getLeadFieldErrorKey("leadName", row.id)] =
      `Lead name is required in row ${rowNumber}.`;
  }

  // Contact requirement adapts to which of email/phone this variant shows.
  const hasEmailField = isFieldVisible("leadEmail", fields);
  const hasPhoneField = isFieldVisible("leadPhoneNumber", fields);

  if (hasEmailField && hasPhoneField) {
    if (!row.leadEmail.trim() && !row.leadPhoneNumber.trim()) {
      const message = `At least one of email or phone is required in row ${rowNumber}.`;
      errors[getLeadFieldErrorKey("leadEmail", row.id)] = message;
      errors[getLeadFieldErrorKey("leadPhoneNumber", row.id)] = message;
    }
  } else if (hasPhoneField && !row.leadPhoneNumber.trim()) {
    errors[getLeadFieldErrorKey("leadPhoneNumber", row.id)] =
      `Phone number is required in row ${rowNumber}.`;
  } else if (hasEmailField && !row.leadEmail.trim()) {
    errors[getLeadFieldErrorKey("leadEmail", row.id)] =
      `Email is required in row ${rowNumber}.`;
  }

  if (
    hasEmailField &&
    row.leadEmail.trim() &&
    !EMAIL_PATTERN.test(row.leadEmail.trim())
  ) {
    errors[getLeadFieldErrorKey("leadEmail", row.id)] =
      `Enter a valid email address in row ${rowNumber}.`;
  }

  if (
    hasPhoneField &&
    row.leadPhoneNumber.trim() &&
    !INDIA_PHONE_PATTERN.test(row.leadPhoneNumber.trim())
  ) {
    errors[getLeadFieldErrorKey("leadPhoneNumber", row.id)] =
      `Enter a valid phone number in row ${rowNumber}.`;
  }

  if (
    isFieldVisible("eventDate", fields) &&
    row.eventDate &&
    Number.isNaN(Date.parse(row.eventDate))
  ) {
    errors[getLeadFieldErrorKey("eventDate", row.id)] =
      `Enter a valid event date in row ${rowNumber}.`;
  }

  // Numeric fields — only validated if the variant shows them and a value was entered.
  const numericFields: (keyof Omit<LeadFormRow, "id">)[] = [
    "valueOfServiceOffers",
    "valueOfPartsOffers",
    "valueOfPartsBilled",
  ];

  for (const field of numericFields) {
    if (!isFieldVisible(field, fields)) continue;
    const raw = row[field] as string;
    if (raw && (Number.isNaN(Number(raw)) || Number(raw) < 0)) {
      errors[getLeadFieldErrorKey(field, row.id)] =
        `Enter a valid, non-negative number in row ${rowNumber}.`;
    }
  }

  return errors;
};

export const clearLeadRowErrors = (
  errors: LeadValidationErrors,
  rowId: string,
) => {
  const next = { ...errors };
  const fieldsToClear: (keyof LeadFormRow)[] = [
    "leadName",
    "leadEmail",
    "leadPhoneNumber",
    "companyName",
    "dealership",
    "location",
    "district",
    "state",
    "eventDate",
    "participantType",
    "participantStatus",
    "machineModel",
    "machineSerial",
    "valueOfServiceOffers",
    "valueOfPartsOffers",
    "valueOfPartsBilled",
  ];
  for (const field of fieldsToClear) {
    delete next[getLeadFieldErrorKey(field, rowId)];
  }
  return next;
};
