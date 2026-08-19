import type {
  LeadFormRow,
  LeadRow,
  ParticipantType,
  ParticipantStatus,
} from "../types/leads.types";

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const asNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const asDateInputValue = (value: unknown): string => {
  // Formats to yyyy-MM-dd for <input type="date">; blank if unparsable.
  const str = asString(value);
  if (!str) return "";
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

const getEventName = (lead: any) => {
  const eventName = lead?.epc?.event_name;

  if (typeof eventName === "string") {
    return eventName;
  }

  return asString(
    eventName?.title ?? eventName?.name ?? lead?.event_name ?? lead?.eventTitle,
  );
};

export const unwrapLeadList = (response: any): unknown[] => {
  const list =
    response?.data?.data?.leads ??
    response?.data?.data?.rows ??
    response?.data?.data ??
    response?.data?.leads ??
    response?.data ??
    [];

  return Array.isArray(list) ? list : [];
};

export const mapLeadResponseToRows = (list: unknown): LeadRow[] => {
  if (!Array.isArray(list)) return [];

  return list
    .map((lead: any): LeadRow | null => {
      const id = asString(lead?.id ?? lead?.leadId);
      if (!id) return null;

      const epc = lead?.epc;

      return {
        id,
        epcId: asString(lead?.epcId ?? lead?.epc_id ?? epc?.id),

        name: asString(lead?.name ?? lead?.lead_name ?? lead?.customerName),
        email: asString(lead?.email ?? lead?.lead_email),
        phone: asString(lead?.phone ?? lead?.lead_contact_no ?? lead?.mobile),
        companyName: asString(lead?.companyName ?? lead?.company_name),
        dealership: asString(lead?.dealership),
        location: asString(lead?.location),
        district: asString(lead?.district),
        state: asString(lead?.state),
        eventDate: asDateInputValue(lead?.eventDate),
        participantType: (lead?.participantType ?? "") as ParticipantType | "",
        participantStatus: (lead?.participantStatus ?? "") as
          | ParticipantStatus
          | "",
        machineModel: asString(lead?.machineModel),
        machineSerial: asString(lead?.machineSerial),
        valueOfServiceOffers: asNumberOrNull(lead?.valueOfServiceOffers),
        valueOfPartsOffers: asNumberOrNull(lead?.valueOfPartsOffers),
        valueOfPartsBilled: asNumberOrNull(lead?.valueOfPartsBilled),
        notes: asString(lead?.notes ?? lead?.remarks),

        created_at: asString(lead?.created_at),
        updated_at: asString(lead?.updated_at),

        proposalNumber: asString(
          epc?.proposal_number ??
            epc?.proposalNumber ??
            lead?.proposalNumber ??
            lead?.proposal_number,
        ),
        event_name: getEventName(lead),
        epcLocation: asString(epc?.location),
        epcStatus: asString(epc?.status ?? lead?.epcStatus),
      };
    })
    .filter(Boolean) as LeadRow[];
};

export const mapLeadRowToFormRow = (lead: LeadRow): LeadFormRow => ({
  id: crypto.randomUUID(),
  leadName: lead.name || "",
  leadEmail: lead.email || "",
  leadPhoneNumber: lead.phone || "",
  companyName: lead.companyName || "",
  dealership: lead.dealership || "",
  location: lead.location || "",
  district: lead.district || "",
  state: lead.state || "",
  eventDate: lead.eventDate || "",
  participantType: lead.participantType || "",
  participantStatus: lead.participantStatus || "",
  machineModel: lead.machineModel || "",
  machineSerial: lead.machineSerial || "",
  valueOfServiceOffers: lead.valueOfServiceOffers?.toString() ?? "",
  valueOfPartsOffers: lead.valueOfPartsOffers?.toString() ?? "",
  valueOfPartsBilled: lead.valueOfPartsBilled?.toString() ?? "",
  notes: lead.notes || "",
});

export const createEmptyLeadFormRow = (): LeadFormRow => ({
  id: crypto.randomUUID(),
  leadName: "",
  leadEmail: "",
  leadPhoneNumber: "",
  companyName: "",
  dealership: "",
  location: "",
  district: "",
  state: "",
  eventDate: "",
  participantType: "",
  participantStatus: "",
  machineModel: "",
  machineSerial: "",
  valueOfServiceOffers: "",
  valueOfPartsOffers: "",
  valueOfPartsBilled: "",
  notes: "",
});
