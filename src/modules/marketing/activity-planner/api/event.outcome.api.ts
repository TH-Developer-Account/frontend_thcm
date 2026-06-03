import { ServerAxios } from "../../../../services/ServerAxios";

export const EventOutcomeApi = {
	eventOutcome: async (
		epcId: string,
		payload: {
			status: string;
			reason: string;
		},
	) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/event-outcome`, payload);

		return data;
	},
	getEventReport: async (epcId: string) => {
		const {
			data: { data },
		} = await ServerAxios.get(`/epc/${epcId}/event-report`);

		return data;
	},
	submitValidationAction: async (
		epcId: string,
		payload: {
			action: string;
			reason: string;
		},
	) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/validate-report`, payload);

		return data;
	},
};
