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
