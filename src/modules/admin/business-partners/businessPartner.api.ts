import { ServerAxios } from "../../../services/ServerAxios";
import type {
	ApiDataResponse,
	BusinessPartner,
	BusinessPartnerListingApiResponse,
	BusinessPartnerListingParams,
	BusinessPartnerListingResult,
	PdfUrlResponse,
} from "./utils/bp.types";

const BUSINESS_PARTNER_URL = "/bp";

export type PdfType = "BUSINESS_PARTNERS";

export const businessPartnersApi = {
	listBusinessPartners: async (
		params: BusinessPartnerListingParams,
	): Promise<BusinessPartnerListingResult> => {
		const response = await ServerAxios.get<
			BusinessPartnerListingApiResponse | BusinessPartner[]
		>(BUSINESS_PARTNER_URL, {
			params: {
				search: params.search?.trim() || undefined,
				page_index: params.pageIndex,
				page_size: params.pageSize,
			},
		});

		const body = response.data;
		const rows = Array.isArray(body) ? body : (body.data ?? []);

		return {
			rows,
			totalCount: Array.isArray(body)
				? rows.length
				: (body.total ?? rows.length),
			pageIndex: Array.isArray(body)
				? (params.pageIndex ?? null)
				: (body.page_index ?? params.pageIndex ?? null),
			pageSize: Array.isArray(body)
				? (params.pageSize ?? null)
				: (body.page_size ?? params.pageSize ?? null),
		};
	},

	getById: async (businessPartnerId: string): Promise<BusinessPartner> => {
		const {
			data: { data },
		} = await ServerAxios.get<ApiDataResponse<BusinessPartner>>(
			`${BUSINESS_PARTNER_URL}/${encodeURIComponent(businessPartnerId)}`,
		);

		return data;
	},

	getPdfUrl: async (
		type: PdfType,
		businessPartnerId: string,
	): Promise<string> => {
		const {
			data: { url },
		} = await ServerAxios.get<PdfUrlResponse>(
			`/pdf/${type}/${encodeURIComponent(businessPartnerId)}/url`,
		);

		return url;
	},
};
