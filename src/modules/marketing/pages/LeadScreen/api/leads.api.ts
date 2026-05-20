import { ServerAxios } from "../../../../../services/ServerAxios";
import { mapLeadResponseToRows, unwrapLeadList } from "../helpers/lead.mapper";
import type {
	CreateLeadsPayload,
	LeadRow,
	UpdateLeadPayload,
} from "../types/leads.types";

export const leadsApi = {
	getAll: async (): Promise<LeadRow[]> => {
		const response = await ServerAxios.get("/leads/get-all-leads");
		return mapLeadResponseToRows(unwrapLeadList(response));
	},

	getByEpcId: async (epcId: string): Promise<LeadRow[]> => {
		if (!epcId) return [];

		try {
			const response = await ServerAxios.get(`/leads/epc/${epcId}`);
			return mapLeadResponseToRows(unwrapLeadList(response));
		} catch (error: any) {
			// Some environments still do not have the EPC-specific route.
			// Fall back to the global list but keep the filtering inside this API layer.
			if (error?.response?.status !== 404) throw error;

			const allLeads = await leadsApi.getAll();
			return allLeads.filter((lead) => lead.epcId === epcId);
		}
	},

	createMany: async (payload: CreateLeadsPayload) => {
		return ServerAxios.post("/leads/create-leads", payload);
	},

	updateOne: async (leadId: string, payload: UpdateLeadPayload) => {
		return ServerAxios.put(`/leads/${leadId}`, payload);
	},

	deleteOne: async (leadId: string) => {
		return ServerAxios.delete(`/leads/${leadId}`);
	},
};
