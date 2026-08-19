import type {
  LeadEventDetails,
  LeadEventGroup,
  LeadRow,
} from "../types/leads.types";

export const groupLeadsByEvent = (
  leads: LeadRow[] | undefined | null,
  epcDetailsMap = new Map<string, LeadEventDetails>(),
): LeadEventGroup[] => {
  const groupedMap = new Map<string, LeadEventGroup>();
  const safeLeads = Array.isArray(leads) ? leads : [];

  for (const lead of safeLeads) {
    const epcId = lead.epcId || "unknown";
    const epcDetails = epcDetailsMap.get(epcId);
    const existing = groupedMap.get(epcId);

    if (existing) {
      existing.leads.push(lead);
      existing.lead_count = existing.leads.length;
      continue;
    }

    groupedMap.set(epcId, {
      epcId,

      proposalNumber:
        lead.proposalNumber || epcDetails?.proposalNumber || epcId,

      event_name: lead.event_name || epcDetails?.event_name || "--",

      // Grouping is per-EPC, so this is the EPC's own location — not the
      // individual lead's captured location (which can legitimately vary
      // per lead now, e.g. Roadshow leads captured at different stops).
      location: lead.epcLocation || epcDetails?.location || "--",

      created_at: epcDetails?.created_at || lead.created_at,

      status: lead.epcStatus || epcDetails?.status,

      lead_count: 1,
      leads: [lead],
    });
  }

  return Array.from(groupedMap.values());
};
