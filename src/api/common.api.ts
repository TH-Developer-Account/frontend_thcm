import { ServerAxios } from "../services/ServerAxios";

export const budgetApi = {
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
