export type ParticipantType =
  | "CUSTOMER"
  | "CUSTOMER_KEY_ACCOUNT"
  | "CUSTOMER_STAFF"
  | "VENDOR_PARTNER"
  | "HITACHI_REPRESENTATIVE"
  | "TATA_HITACHI_EXECUTIVE"
  | "DEALERSHIP_EXECUTIVE"
  | "FINANCIER_EXECUTIVE"
  | "MACHINE_OPERATOR"
  | "MACHINE_MECHANIC"
  | "OTHER";

export type ParticipantStatus =
  | "COLD_ENQUIRY"
  | "WARM_ENQUIRY"
  | "HOT_ENQUIRY"
  | "EVENT_ATTENDEE"
  | "FELICITATION"
  | "KEY_HANDOVER"
  | "BOOKING";

export const PARTICIPANT_TYPE_LABELS: Record<ParticipantType, string> = {
  CUSTOMER: "Customer",
  CUSTOMER_KEY_ACCOUNT: "Customer-Key Account",
  CUSTOMER_STAFF: "Customer Staff",
  VENDOR_PARTNER: "Vendor Partner",
  HITACHI_REPRESENTATIVE: "Hitachi Representative",
  TATA_HITACHI_EXECUTIVE: "Tata Hitachi Executive",
  DEALERSHIP_EXECUTIVE: "Dealership Executive",
  FINANCIER_EXECUTIVE: "Financier Executive",
  MACHINE_OPERATOR: "Machine Operator",
  MACHINE_MECHANIC: "Machine Mechanic",
  OTHER: "Other",
};

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  COLD_ENQUIRY: "Cold Enquiry",
  WARM_ENQUIRY: "Warm Enquiry",
  HOT_ENQUIRY: "Hot Enquiry",
  EVENT_ATTENDEE: "Event attendee",
  FELICITATION: "Felicitation",
  KEY_HANDOVER: "Key Handover",
  BOOKING: "Booking",
};

// ── Form-config contract — mirrors leadFormVariant.ts on the backend ─────────
// The frontend never hardcodes which fields belong to which event type; it
// always asks GET /leads/form-config/:epcId and renders off the response.

export type LeadFormVariant = "FORM_1" | "FORM_2" | "FORM_3" | "NOT_APPLICABLE";

export type LeadFormFieldKey =
  | "name"
  | "email"
  | "phone"
  | "companyName"
  | "dealership"
  | "location"
  | "district"
  | "state"
  | "eventDate"
  | "participantType"
  | "participantStatus"
  | "machineModel"
  | "machineSerial"
  | "valueOfServiceOffers"
  | "valueOfPartsOffers"
  | "valueOfPartsBilled"
  | "notes";

export type LeadFormConfig = {
  variant: LeadFormVariant;
  fields: LeadFormFieldKey[];
};

// ─────────────────────────────────────────────────────────────────────────────

export type LeadPageMode = "create" | "edit" | "view";

export type LeadInfo = {
  epcId: string;
  leadId?: string | null;
  proposalNumber?: string;
  eventName?: string;
  location?: string;
  status?: string;
};

export type LeadRow = {
  id: string;
  epcId: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  dealership: string;
  location: string;
  district: string;
  state: string;
  eventDate: string;
  participantType: ParticipantType | "";
  participantStatus: ParticipantStatus | "";
  machineModel: string;
  machineSerial: string;
  valueOfServiceOffers: number | null;
  valueOfPartsOffers: number | null;
  valueOfPartsBilled: number | null;
  notes: string;

  created_at?: string;
  updated_at?: string;

  // EPC display fields from nested backend EPC object
  proposalNumber?: string;
  event_name?: string;
  epcLocation?: string; // renamed from `location` to avoid colliding with the lead's own location field above
  epcStatus?: string;
};

// ── Manual-entry form row — now variant-aware. Every field is optional at
// the type level since which ones render depends on LeadFormConfig; the
// entry form only shows/validates the subset in config.fields. ─────────────
export type LeadFormRow = {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhoneNumber: string;
  companyName: string;
  dealership: string;
  location: string;
  district: string;
  state: string;
  eventDate: string;
  participantType: ParticipantType | "";
  participantStatus: ParticipantStatus | "";
  machineModel: string;
  machineSerial: string;
  valueOfServiceOffers: string; // kept as string in form state, parsed to number on submit
  valueOfPartsOffers: string;
  valueOfPartsBilled: string;
  notes: string;
};

export type LeadPayloadItem = {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  dealership?: string;
  location?: string;
  district?: string;
  state?: string;
  eventDate?: string;
  participantType?: ParticipantType;
  participantStatus?: ParticipantStatus;
  machineModel?: string;
  machineSerial?: string;
  valueOfServiceOffers?: number;
  valueOfPartsOffers?: number;
  valueOfPartsBilled?: number;
  notes?: string;
};

export type CreateLeadsPayload = {
  epcId: string;
  leads: LeadPayloadItem[];
};

export type leadsImportPayload = FormData;

export type UpdateLeadPayload = LeadPayloadItem & {
  epcId: string;
};

export type LeadEventDetails = {
  epcId: string;
  proposalNumber?: string;
  event_name?: string;
  location?: string;
  status?: string;
  created_at?: string;
};

export type LeadEventGroup = LeadEventDetails & {
  lead_count: number;
  leads: LeadRow[];
};

export type LeadValidationErrors = Record<string, string>;

export type LeadListParams = {
  page: number;
  pageSize: number;
};

export type LeadPagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type LeadListResult = {
  data: LeadRow[];
  pagination: LeadPagination;
};
