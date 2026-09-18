import { ServerAxios } from "../../../../services/ServerAxios";

import {
	mapBusinessPartnerListItem,
	unwrapData,
} from "../utils/businessPartner.mapper";

import type {
	ApiEnvelope,
	BusinessPartnerAddress,
	BusinessPartnerAddressPayload,
	BusinessPartnerContact,
	BusinessPartnerDetail,
	BusinessPartnerListApiResponse,
	BusinessPartnerListItem,
	BusinessPartnerListingResult,
	CreateBusinessPartnerPayload,
	NormalizedBusinessPartnerListingParams,
	UpdateBusinessPartnerPayload,
	UpdateBusinessPartnerPeoplePayload,
} from "../utils/bp.types";

const API_URL = "/business-partner";

const getPartnerUrl = (businessPartnerId: string): string =>
	`${API_URL}/${encodeURIComponent(businessPartnerId)}`;

const getAddressesUrl = (businessPartnerId: string): string =>
	`${getPartnerUrl(businessPartnerId)}/addresses`;

const getContactsUrl = (businessPartnerId: string): string =>
	`${getPartnerUrl(businessPartnerId)}/contacts`;

export const businessPartnerKeys = {
	all: ["business-partners"] as const,

	lists: () => [...businessPartnerKeys.all, "list"] as const,

	list: (params: NormalizedBusinessPartnerListingParams) =>
		[...businessPartnerKeys.lists(), params] as const,

	details: () => [...businessPartnerKeys.all, "detail"] as const,

	detail: (businessPartnerId: string) =>
		[...businessPartnerKeys.details(), businessPartnerId] as const,
};

export const businessPartnerApi = {
	list: async (
		params: NormalizedBusinessPartnerListingParams,
	): Promise<BusinessPartnerListingResult> => {
		const response = await ServerAxios.get<
			BusinessPartnerListApiResponse | BusinessPartnerListItem[]
		>(API_URL, {
			params: {
				search: params.search?.trim() || undefined,
				status: params.status?.length ? params.status : undefined,
				zone: params.zone?.length ? params.zone : undefined,

				// Frontend uses pageIndex/pageSize.
				// Backend expects page/limit.
				page: params.pageIndex,
				limit: params.pageSize,
			},
		});

		const body = response.data;

		const rawRows = Array.isArray(body) ? body : (body.rows ?? body.data ?? []);

		const rows = rawRows.map(mapBusinessPartnerListItem);

		const totalCount = Array.isArray(body)
			? rows.length
			: (body.totalCount ?? body.total ?? rows.length);

		const pageIndex = Array.isArray(body)
			? params.pageIndex
			: (body.page ?? body.page_index ?? params.pageIndex);

		const pageSize = Array.isArray(body)
			? params.pageSize
			: (body.limit ?? body.page_size ?? params.pageSize);

		const totalPages = Array.isArray(body)
			? Math.max(Math.ceil(totalCount / pageSize), 1)
			: (body.totalPages ??
				body.total_pages ??
				Math.max(Math.ceil(totalCount / pageSize), 1));

		return {
			rows,
			totalCount,
			pageIndex,
			pageSize,
			totalPages,
		};
	},

	getById: async (
		businessPartnerId: string,
	): Promise<BusinessPartnerDetail> => {
		const response = await ServerAxios.get<
			BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
		>(getPartnerUrl(businessPartnerId));

		return unwrapData(response.data);
	},

	remove: async (businessPartnerId: string): Promise<string> => {
		await ServerAxios.delete(getPartnerUrl(businessPartnerId));

		return businessPartnerId;
	},

	createAddress: async (
		businessPartnerId: string,
		payload: BusinessPartnerAddressPayload,
	): Promise<BusinessPartnerAddress> => {
		const response = await ServerAxios.post<
			BusinessPartnerAddress | ApiEnvelope<BusinessPartnerAddress>
		>(getAddressesUrl(businessPartnerId), payload);

		return unwrapData(response.data);
	},

	updateAddress: async (
		businessPartnerId: string,
		addressId: string,
		payload: BusinessPartnerAddressPayload,
	): Promise<BusinessPartnerAddress> => {
		const response = await ServerAxios.patch<
			BusinessPartnerAddress | ApiEnvelope<BusinessPartnerAddress>
		>(
			`${getAddressesUrl(businessPartnerId)}/${encodeURIComponent(addressId)}`,
			payload,
		);

		return unwrapData(response.data);
	},

	setDefaultAddress: async (
		businessPartnerId: string,
		addressId: string,
	): Promise<BusinessPartnerAddress> => {
		const response = await ServerAxios.patch<
			BusinessPartnerAddress | ApiEnvelope<BusinessPartnerAddress>
		>(
			`${getAddressesUrl(businessPartnerId)}/${encodeURIComponent(addressId)}`,
			{
				isDefault: true,
			},
		);

		return unwrapData(response.data);
	},

	deleteAddress: async (
		businessPartnerId: string,
		addressId: string,
	): Promise<string> => {
		await ServerAxios.delete(
			`${getAddressesUrl(businessPartnerId)}/${encodeURIComponent(addressId)}`,
		);

		return addressId;
	},

	addPeople: async (
		businessPartnerId: string,
		payload: UpdateBusinessPartnerPeoplePayload,
	): Promise<BusinessPartnerContact[]> => {
		const response = await ServerAxios.post<
			BusinessPartnerContact[] | ApiEnvelope<BusinessPartnerContact[]>
		>(getContactsUrl(businessPartnerId), payload);

		return unwrapData(response.data);
	},

	updatePeople: async (
		businessPartnerId: string,
		payload: UpdateBusinessPartnerPeoplePayload,
	): Promise<BusinessPartnerContact[]> => {
		const response = await ServerAxios.patch<
			BusinessPartnerContact[] | ApiEnvelope<BusinessPartnerContact[]>
		>(getContactsUrl(businessPartnerId), payload);

		return unwrapData(response.data);
	},

	removeContact: async (
		businessPartnerId: string,
		contactId: string,
	): Promise<string> => {
		await ServerAxios.delete(
			`${getContactsUrl(businessPartnerId)}/${encodeURIComponent(contactId)}`,
		);

		return contactId;
	},

	create: async (
		payload: CreateBusinessPartnerPayload,
	): Promise<BusinessPartnerDetail> => {
		const response = await ServerAxios.post<
			BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
		>(API_URL, payload);

		return unwrapData(response.data);
	},

	update: async (
		businessPartnerId: string,
		payload: UpdateBusinessPartnerPayload,
	): Promise<BusinessPartnerDetail> => {
		const response = await ServerAxios.patch<
			BusinessPartnerDetail | ApiEnvelope<BusinessPartnerDetail>
		>(getPartnerUrl(businessPartnerId), payload);

		return unwrapData(response.data);
	},
};

/**
 * Backward-compatible alias. Existing imports using the plural
 * name can continue working.
 */
export const businessPartnersApi = businessPartnerApi;
