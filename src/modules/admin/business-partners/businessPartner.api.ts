import { ServerAxios } from "../../../services/ServerAxios";
import { mapBusinessPartnerListItem } from "./utils/businessPartner.mapper.ts";
import type {
	BusinessPartnerDetail,
	BusinessPartnerListApiItem,
	BusinessPartnerListingResult,
} from "./utils/bp.types";

const API_URL = "/bp";

type ApiDataResponse<T> = { success: boolean; data: T };
type BusinessPartnerListResponse = {
	success: boolean;
	data: BusinessPartnerListApiItem[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};
export type BusinessPartnerListingParams = {
	search?: string;
	page?: number;
	limit?: number;
};

export const businessPartnerKeys = {
	all: ["business-partners"] as const,
	list: (params: BusinessPartnerListingParams) =>
		[...businessPartnerKeys.all, "list", params] as const,
	detail: (id: string) => [...businessPartnerKeys.all, "detail", id] as const,
};

export const businessPartnersApi = {
	list: async (
		params: BusinessPartnerListingParams,
	): Promise<BusinessPartnerListingResult> => {
		const { data } = await ServerAxios.get<BusinessPartnerListResponse>(
			API_URL,
			{
				params: {
					search: params.search?.trim() || undefined,
					page: params.page ?? 1,
					limit: params.limit ?? 20,
				},
			},
		);
		return {
			rows: data.data.map(mapBusinessPartnerListItem),
			totalCount: data.total,
			page: data.page,
			limit: data.limit,
			totalPages: data.totalPages,
		};
	},
	getById: async (id: string): Promise<BusinessPartnerDetail> => {
		const { data } = await ServerAxios.get<
			ApiDataResponse<BusinessPartnerDetail>
		>(`${API_URL}/${encodeURIComponent(id)}`);
		return data.data;
	},
};
