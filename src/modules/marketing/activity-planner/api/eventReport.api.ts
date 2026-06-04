import { ServerAxios } from "../../../../services/ServerAxios";
import { type EventReportDetail } from "../forms/EventReport/types";

export const eventReportApi = {
	getByEpcId: async (epcId: string): Promise<EventReportDetail | null> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/report/${epcId}`);

		return data ?? null;
	},

	submit: async (epcId: string, payload: FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${epcId}/submit`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return data;
	},

	resubmit: async (epcId: string, payload: FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${epcId}/resubmit`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		return data;
	},

	approve: async (reportId: string) => {
		const {
			data: { data },
		} = await ServerAxios.post(`/report/${reportId}/validate`);

		return data;
	},
};
