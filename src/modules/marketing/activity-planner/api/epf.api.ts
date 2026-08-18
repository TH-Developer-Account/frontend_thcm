import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EpfCreatePayload,
	EpfDetailResponse,
	EpfUpdatePayload,
} from "../types/epf.types";

export const epfApi = {
	getById: async (epfId: string): Promise<EpfDetailResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/epf/${epfId}`);

		return data;
	},

	// create: async (payload: EpfCreatePayload) => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.post("/epf", payload);

	// 	return data;
	// },
	create: async (payload: EpfCreatePayload | FormData) => {
		const {
			data: { data },
		} = await ServerAxios.post("/epf", payload, {
			headers:
				payload instanceof FormData
					? { "Content-Type": "multipart/form-data" }
					: undefined,
		});

		return data;
	},
	// update: async (epfId: string, payload: EpfUpdatePayload) => {
	// 	const {
	// 		data: { data },
	// 	} = await ServerAxios.put(`/epf/${epfId}`, payload);

	// 	return data;
	// },
	update: async (epfId: string, payload: EpfUpdatePayload | FormData) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/epf/${epfId}`, payload, {
			headers:
				payload instanceof FormData
					? { "Content-Type": "multipart/form-data" }
					: undefined,
		});

		return data;
	},

	getProducts: async () => {
		const {
			data: { data },
		} = await ServerAxios.get("/master-data/products", {
			params: { productType: "EPF" },
		});

		return data;
	},
};
