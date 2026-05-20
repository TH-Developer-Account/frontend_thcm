import type { LeadFormRow, LeadRow } from "../types/leads.types";

const asString = (value: unknown, fallback = "") =>
	typeof value === "string" && value.trim() ? value.trim() : fallback;

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

				name: asString(
					lead?.name ??
						lead?.lead_name ??
						lead?.lead_first_name ??
						lead?.customerName,
				),
				email: asString(lead?.email ?? lead?.lead_email),
				phone: asString(lead?.phone ?? lead?.lead_contact_no ?? lead?.mobile),
				notes: asString(lead?.notes ?? lead?.remarks),

				status: asString(lead?.status),
				created_at: asString(lead?.created_at),
				updated_at: asString(lead?.updated_at),

				proposalNumber: asString(
					epc?.proposal_number ??
						epc?.proposalNumber ??
						lead?.proposalNumber ??
						lead?.proposal_number,
				),
				event_name: getEventName(lead),
				location: asString(epc?.location ?? lead?.location),
				epcStatus: asString(epc?.status ?? lead?.epcStatus),
			};
		})
		.filter(Boolean) as LeadRow[];
};

export const mapLeadRowToFormRow = (lead: LeadRow): LeadFormRow => ({
	id: crypto.randomUUID(),
	leadName: lead.name || "",
	leadPhoneNumber: lead.phone || "",
	leadEmail: lead.email || "",
	notes: lead.notes || "",
});

export const createEmptyLeadFormRow = (): LeadFormRow => ({
	id: crypto.randomUUID(),
	leadName: "",
	leadPhoneNumber: "",
	leadEmail: "",
	notes: "",
});
