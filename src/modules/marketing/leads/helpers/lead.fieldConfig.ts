import type { LeadFormFieldKey, LeadFormRow } from "../types/leads.types";

// ── Single source of truth for how a LeadFormFieldKey (backend/config
// vocabulary) maps to a LeadFormRow key (form-state vocabulary), plus
// display metadata for rendering. Used by lead.validation.ts, LeadEntryTable,
// and lead.payload.ts — extracted here once it was needed in more than one
// place, not before. ──────────────────────────────────────────────────────

export const CONFIG_KEY_TO_FORM_FIELD: Record<
  LeadFormFieldKey,
  keyof Omit<LeadFormRow, "id">
> = {
  name: "leadName",
  email: "leadEmail",
  phone: "leadPhoneNumber",
  companyName: "companyName",
  dealership: "dealership",
  location: "location",
  district: "district",
  state: "state",
  eventDate: "eventDate",
  participantType: "participantType",
  participantStatus: "participantStatus",
  machineModel: "machineModel",
  machineSerial: "machineSerial",
  valueOfServiceOffers: "valueOfServiceOffers",
  valueOfPartsOffers: "valueOfPartsOffers",
  valueOfPartsBilled: "valueOfPartsBilled",
  notes: "notes",
};

export const FORM_FIELD_TO_CONFIG_KEY: Partial<
  Record<keyof Omit<LeadFormRow, "id">, LeadFormFieldKey>
> = Object.fromEntries(
  Object.entries(CONFIG_KEY_TO_FORM_FIELD).map(([configKey, formField]) => [
    formField,
    configKey,
  ]),
);

export const FIELD_LABELS: Record<LeadFormFieldKey, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  companyName: "Company Name",
  dealership: "Dealership",
  location: "Location",
  district: "District",
  state: "State",
  eventDate: "Event Date",
  participantType: "Participant Type",
  participantStatus: "Participant Status",
  machineModel: "Machine Model",
  machineSerial: "Machine Serial",
  valueOfServiceOffers: "Value of Service Offers",
  valueOfPartsOffers: "Value of Parts Offers",
  valueOfPartsBilled: "Value of Parts Billed",
  notes: "Notes",
};

// Canonical render order — independent of whatever order the backend's
// fields array happens to come back in.
export const FIELD_RENDER_ORDER: LeadFormFieldKey[] = [
  "name",
  "email",
  "phone",
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
  "notes",
];

export type FieldInputKind =
  | "text"
  | "email"
  | "mobile"
  | "date"
  | "number"
  | "select";

export const FIELD_INPUT_KIND: Record<LeadFormFieldKey, FieldInputKind> = {
  name: "text",
  email: "email",
  phone: "mobile",
  companyName: "text",
  dealership: "text",
  location: "text",
  district: "text",
  state: "text",
  eventDate: "date",
  participantType: "select",
  participantStatus: "select",
  machineModel: "text",
  machineSerial: "text",
  valueOfServiceOffers: "number",
  valueOfPartsOffers: "number",
  valueOfPartsBilled: "number",
  notes: "text",
};

export const orderFields = (fields: LeadFormFieldKey[]): LeadFormFieldKey[] =>
  FIELD_RENDER_ORDER.filter((field) => fields.includes(field));

export type FieldTemplateMeta = {
  example: string;
  width: number;
  format: string;
  notes: string;
};

export const REQUIRED_FIELDS: LeadFormFieldKey[] = ["name"];

export const FIELD_TEMPLATE_META: Record<LeadFormFieldKey, FieldTemplateMeta> =
  {
    name: {
      example: "John Doe",
      width: 28,
      format: "Text",
      notes: "Full name of the lead",
    },
    email: {
      example: "xyz@gmail.com",
      width: 24,
      format: "Email",
      notes: "Must be a valid email address",
    },
    phone: {
      example: "9876543210",
      width: 22,
      format: "Text",
      notes: "10-digit number",
    },
    companyName: {
      example: "Acme Construction",
      width: 28,
      format: "Text",
      notes: "Lead's company or organization",
    },
    dealership: {
      example: "Kailash-J",
      width: 24,
      format: "Text",
      notes: "Dealership name",
    },
    location: {
      example: "Pune",
      width: 20,
      format: "Text",
      notes: "Event location for this lead",
    },
    district: {
      example: "Pune",
      width: 20,
      format: "Text",
      notes: "Event district for this lead",
    },
    state: {
      example: "Maharashtra",
      width: 20,
      format: "Text",
      notes: "Event state for this lead",
    },
    eventDate: {
      example: "2026-08-15",
      width: 16,
      format: "Date (YYYY-MM-DD)",
      notes: "Date this lead was captured at the event",
    },
    participantType: {
      example: "Customer",
      width: 24,
      format: "Text",
      notes:
        "Must match a valid participant type, e.g. Customer, Financier Executive",
    },
    participantStatus: {
      example: "Hot Enquiry",
      width: 20,
      format: "Text",
      notes: "Must match a valid status, e.g. Cold/Warm/Hot Enquiry, Booking",
    },
    machineModel: {
      example: "EX 210",
      width: 20,
      format: "Text",
      notes: "Machine model inspected or discussed",
    },
    machineSerial: {
      example: "HCEA12345",
      width: 20,
      format: "Text",
      notes: "Machine serial number",
    },
    valueOfServiceOffers: {
      example: "25000",
      width: 22,
      format: "Number",
      notes: "Value of service offered, in ₹",
    },
    valueOfPartsOffers: {
      example: "15000",
      width: 22,
      format: "Number",
      notes: "Value of parts offered, in ₹",
    },
    valueOfPartsBilled: {
      example: "10000",
      width: 22,
      format: "Number",
      notes: "Value of parts billed, in ₹",
    },
    notes: {
      example: "Interested in financing options",
      width: 28,
      format: "Text",
      notes: "Any additional remarks",
    },
  };
