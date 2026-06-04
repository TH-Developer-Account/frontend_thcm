import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EventDeviationPayload,
	EventOutcomePayload,
} from "../types/event.outcome.types";

export const eventOutcomeApi = {
	eventOutcome: async (epcId: string, payload: EventOutcomePayload) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/event-outcome`, payload);

		return data;
	},

	deviation: async (epcId: string, payload: EventDeviationPayload) => {
		const isFormData = payload instanceof FormData;

		const { data } = await ServerAxios.post(
			`/event-deviation/${epcId}`,
			payload,
			isFormData
				? {
						headers: {
							"Content-Type": "multipart/form-data",
						},
					}
				: undefined,
		);

		return data;
	},
};
