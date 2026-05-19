import type {
	LeadEventDetails,
	LeadEventGroup,
	LeadRow,
} from "../types/leads.types";

export const groupLeadsByEvent = (
	leads: LeadRow[],
	epcDetailsMap = new Map<string, LeadEventDetails>(),
): LeadEventGroup[] => {
	const groupedMap = new Map<string, LeadEventGroup>();

	for (const lead of leads) {
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
			event_name: epcDetails?.event_name || "--",
			location: epcDetails?.location || "--",
			created_at: epcDetails?.created_at || lead.created_at,
			lead_count: 1,
			leads: [lead],
		});
	}

	return Array.from(groupedMap.values());
};
