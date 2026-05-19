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

	create: async (payload: EpfCreatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.post("/epf", payload);

		return data;
	},

	update: async (epfId: string, payload: EpfUpdatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/epf/${epfId}`, payload);

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

	getBudgetInfo: async (budgetMasterId?: string | null) => {
		const response = budgetMasterId
			? await ServerAxios.get(`/master-data/budget/${budgetMasterId}`)
			: await ServerAxios.get("/master-data/budget");

		const raw = response?.data;

		return (
			raw?.data ??
			raw?.d?.results?.[0] ??
			raw?.data?.[0] ??
			raw?.results?.[0] ??
			raw
		);
	},
};
