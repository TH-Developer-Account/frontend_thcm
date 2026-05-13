// helpers/groupLeadsByEvent.ts

import type { LeadEventGroup, LeadRow } from "../types/leads.types";

export const groupLeadsByEvent = (leads: LeadRow[] = []): LeadEventGroup[] => {
	const map = new Map<string, LeadEventGroup>();

	leads.forEach((lead) => {
		const epcId = lead.epc_id;

		if (!epcId) return;

		if (!map.has(epcId)) {
			map.set(epcId, {
				epc_id: epcId,
				proposal_number: lead.proposal_number,
				event_name: lead.event_name,
				location: lead.location,
				created_at: lead.created_at,
				lead_count: 0,
				leads: [],
			});
		}

		const group = map.get(epcId);

		if (!group) return;

		group.leads.push(lead);
		group.lead_count = group.leads.length;
	});

	return Array.from(map.values());
};
