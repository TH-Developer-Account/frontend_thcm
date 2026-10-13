import type {
  LeadFormFieldKey,
  LeadFormRow,
  LeadPayloadItem,
  UpdateLeadPayload,
} from "../types/leads.types";

// ── Builds a payload with only the fields the current variant includes.
// Sending fields the backend genuinely doesn't need for this event type
// isn't harmful (they're all nullable columns), but keeping the payload
// scoped to what the form actually captured avoids silently persisting
// stale/blank values from inputs the user never saw. ──────────────────────

export const buildLeadPayloadItem = (
  row: LeadFormRow,
  fields: LeadFormFieldKey[],
): LeadPayloadItem => {
  const has = (key: LeadFormFieldKey) => fields.includes(key);
  const payload: LeadPayloadItem = { name: row.leadName.trim() };

  if (has("email") && row.leadEmail.trim())
    payload.email = row.leadEmail.trim();
  if (has("phone") && row.leadPhoneNumber.trim())
    payload.phone = row.leadPhoneNumber.trim();
  if (has("companyName") && row.companyName.trim())
    payload.companyName = row.companyName.trim();
  if (has("dealership") && row.dealership.trim())
    payload.dealership = row.dealership.trim();
  if (has("location") && row.location.trim())
    payload.location = row.location.trim();
  if (has("district") && row.district.trim())
    payload.district = row.district.trim();
  if (has("state") && row.state.trim()) payload.state = row.state.trim();
  if (has("eventDate") && row.eventDate) payload.eventDate = row.eventDate;
  if (has("participantType") && row.participantType)
    payload.participantType = row.participantType;
  if (has("participantStatus") && row.participantStatus)
    payload.participantStatus = row.participantStatus;
  if (has("machineModel") && row.machineModel.trim())
    payload.machineModel = row.machineModel.trim();
  if (has("machineSerial") && row.machineSerial.trim())
    payload.machineSerial = row.machineSerial.trim();
  if (has("valueOfServiceOffers") && row.valueOfServiceOffers) {
    payload.valueOfServiceOffers = Number(row.valueOfServiceOffers);
  }
  if (has("valueOfPartsOffers") && row.valueOfPartsOffers) {
    payload.valueOfPartsOffers = Number(row.valueOfPartsOffers);
  }
  if (has("valueOfPartsBilled") && row.valueOfPartsBilled) {
    payload.valueOfPartsBilled = Number(row.valueOfPartsBilled);
  }
  if (has("notes") && row.notes.trim()) payload.notes = row.notes.trim();

  return payload;
};

export const buildUpdateLeadPayload = (
  epcId: string,
  row: LeadFormRow,
  fields: LeadFormFieldKey[],
): UpdateLeadPayload => ({
  epcId,
  ...buildLeadPayloadItem(row, fields),
});
