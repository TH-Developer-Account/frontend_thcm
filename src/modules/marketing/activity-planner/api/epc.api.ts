import qs from "qs";
import { ServerAxios } from "../../../../services/ServerAxios";
import type {
	EpcCreatePayload,
	EpcDetailResponse,
	EpcListParams,
	EpcListResponse,
	EpcUpdatePayload,
} from "../types/epc.types";

export const epcApi = {
	getList: async (params: EpcListParams): Promise<EpcListResponse> => {
		const { limit, ...restParams } = params;

		const response = await ServerAxios.get("/epc", {
			params: {
				...restParams,
				pageSize: limit,
			},
			paramsSerializer: (requestParams) =>
				qs.stringify(requestParams, {
					arrayFormat: "repeat",
					skipNulls: true,
				}),
		});

		return response.data;
	},

	getById: async (epcId: string): Promise<EpcDetailResponse> => {
		const {
			data: { data },
		} = await ServerAxios.get(`/epc/${epcId}`);
		return data;
	},

	create: async (payload: EpcCreatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.post("/epc", payload);
		return data;
	},

	update: async (epcId: string, payload: EpcUpdatePayload) => {
		const {
			data: { data },
		} = await ServerAxios.put(`/epc/${epcId}`, payload);
		return data;
	},
};
