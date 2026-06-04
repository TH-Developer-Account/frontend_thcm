import { ServerAxios } from "../../../../services/ServerAxios";

export type EventOutcomePayload = {
	status: string;
	reason: string;
};

export const eventOutcomeApi = {
	eventOutcome: async (epcId: string, payload: EventOutcomePayload) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/event-outcome`, payload);

		return data;
	},

	deviation: async (epcId: string, payload: EventOutcomePayload) => {
		const { data } = await ServerAxios.post(
			`/epc/${epcId}/event-deviation`,
			payload,
		);

		return data;
	},
};
