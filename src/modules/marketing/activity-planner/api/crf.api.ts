import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	CrfCreatePayload,
	CrfDetailResponse,
	CrfUpdatePayload,
} from "../types/crf.types";

export const crfApi = {
	getById: async (crfId: string): Promise<CrfDetailResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/crf/${crfId}`);

		return data;
	},

	create: async (payload: CrfCreatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.post("/crf", payload);

		return data;
	},

	update: async (crfId: string, payload: CrfUpdatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/crf/${crfId}`, payload);

		return data;
	},

	getProducts: async () => {
		const {
			data: { data },
		} = await ServerAxios.get("/master-data/products", {
			params: { productType: "CRF" },
		});

		return data;
	},
};
