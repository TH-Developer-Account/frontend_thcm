import type { LeadRow } from "../types/leads.types";

export const mapLeadResponseToRows = (list: unknown): LeadRow[] => {
	if (!Array.isArray(list)) return [];

	return list.map((lead: LeadRow) => {
		const epcId = lead.epcId ?? "";

		return {
			id: lead.id,
			epcId,

			name: lead.name ?? "",
			email: lead.email ?? "",
			phone: lead.phone ?? "",
			notes: lead.notes ?? "",

			status: lead.status,
			created_at: lead.created_at,
			updated_at: lead.updated_at,
		};
	});
};
