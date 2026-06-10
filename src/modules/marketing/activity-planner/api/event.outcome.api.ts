import { ServerAxios } from "../../../../services/ServerAxios";
import type { EventOutcomePayload } from "../types/event.outcome.types";

export const eventOutcomeApi = {
	eventOutcome: async (epcId: string, payload: EventOutcomePayload) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/event-outcome`, payload);

		return data;
	},
	closeEpc: async (epcId: string) => {
		const {
			data: { data },
		} = await ServerAxios.patch(`/epc/${epcId}/close`);

		return data;
	},
};
