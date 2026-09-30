import { ServerAxios } from "../../../../services/ServerAxios";

import {
	mapBPUser,
	mapBusinessPartnerListItem,
	unwrapData,
} from "../utils/businessPartner.mapper";

import type {
	BPUserRow,
	BPUserViewModel,
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
	ApiEnvelope,
	BPContactPayload,
	UpdateBPContactPayload,
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

	contacts: (businessPartnerId: string) =>
		[...businessPartnerKeys.detail(businessPartnerId), "contacts"] as const,

	contact: (businessPartnerId: string, contactId: string) =>
		[...businessPartnerKeys.contacts(businessPartnerId), contactId] as const,

	usersOfPartner: (businessPartnerId: string) =>
		[...businessPartnerKeys.all, "users", businessPartnerId] as const,
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

	/**
	 * BP Users tab — GET /users?businessPartnerId=...&profile=all. This is
	 * the Users module's own listing endpoint (see getUsers in
	 * user.controller.ts, which already supports an equality filter on
	 * businessPartnerId), reused here rather than duplicated so the two
	 * modules stay backed by one query. Deliberately calls it directly
	 * with ServerAxios instead of importing the Users module's api layer,
	 * same as BusinessPartnerAsyncSelect does — this stays a business-
	 * partner-feature file, not a cross-module import.
	 */
	getUsers: async (businessPartnerId: string): Promise<BPUserViewModel[]> => {
		const response = await ServerAxios.get<
			| BPUserRow[]
			| {
					rows?: BPUserRow[];
					data?: BPUserRow[] | { rows?: BPUserRow[] };
			  }
		>("/users", {
			params: {
				profile: "all",
				businessPartnerId,
			},
		});

		const body = response.data;

		const rows: BPUserRow[] = Array.isArray(body)
			? body
			: Array.isArray(body?.rows)
				? (body.rows as BPUserRow[])
				: Array.isArray(body?.data)
					? (body.data as BPUserRow[])
					: Array.isArray(
								(body?.data as { rows?: BPUserRow[] } | undefined)?.rows,
						  )
						? ((body?.data as { rows?: BPUserRow[] }).rows as BPUserRow[])
						: [];

		if (!Array.isArray(rows)) {
			console.error("Unexpected /users response:", body);
			return [];
		}

		return rows.map(mapBPUser);
	},

	/**
	 * BP Users tab's only action — PATCH /users/:id { isDefaultContact: true }.
	 * Matches the Users module's existing attribute-only update endpoint;
	 * does not attempt to un-set any other user's default (no such
	 * exclusivity rule exists server-side today, so this stays a plain
	 * attribute update rather than inventing new backend behavior).
	 */
	setDefaultUser: async (userId: string): Promise<void> => {
		await ServerAxios.patch(`/users/${encodeURIComponent(userId)}`, {
			isDefaultContact: true,
		});
	},

	/**
	 * BP Users tab's second action — PATCH /users/:id/status. NOT the
	 * plain "update user" endpoint: user.controller.ts's updateUser
	 * deliberately destructures is_active out and ignores it (see the
	 * comment on that handler — "does not touch password, is_active"),
	 * so changing active status has to go through this dedicated status
	 * endpoint, same one the Users module's own table uses
	 * (userApi.updateUserStatus in users.api.ts).
	 */
	setUserActiveStatus: async (
		userId: string,
		isActive: boolean,
	): Promise<void> => {
		await ServerAxios.patch(`/users/${encodeURIComponent(userId)}/status`, {
			status: isActive ? "Active" : "Inactive",
			is_active: isActive,
		});
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
	getContacts: async (
		businessPartnerId: string,
	): Promise<BusinessPartnerContact[]> => {
		const response = await ServerAxios.get<
			BusinessPartnerContact[] | ApiEnvelope<BusinessPartnerContact[]>
		>(getContactsUrl(businessPartnerId));

		return unwrapData(response.data);
	},

	getContactById: async (
		businessPartnerId: string,
		contactId: string,
	): Promise<BusinessPartnerContact> => {
		const response = await ServerAxios.get<
			BusinessPartnerContact | ApiEnvelope<BusinessPartnerContact>
		>(`${getContactsUrl(businessPartnerId)}/${encodeURIComponent(contactId)}`);

		return unwrapData(response.data);
	},

	createContact: async (
		businessPartnerId: string,
		payload: BPContactPayload,
	): Promise<BusinessPartnerContact> => {
		const response = await ServerAxios.post<
			BusinessPartnerContact | ApiEnvelope<BusinessPartnerContact>
		>(getContactsUrl(businessPartnerId), payload);

		return unwrapData(response.data);
	},

	updateContact: async (
		businessPartnerId: string,
		contactId: string,
		payload: UpdateBPContactPayload,
	): Promise<BusinessPartnerContact> => {
		const response = await ServerAxios.patch<
			BusinessPartnerContact | ApiEnvelope<BusinessPartnerContact>
		>(
			`${getContactsUrl(businessPartnerId)}/${encodeURIComponent(contactId)}`,
			payload,
		);

		return unwrapData(response.data);
	},

	deleteContact: async (
		businessPartnerId: string,
		contactId: string,
	): Promise<string> => {
		await ServerAxios.delete(
			`${getContactsUrl(businessPartnerId)}/${encodeURIComponent(contactId)}`,
		);

		return contactId;
	},
};

/**
 * Backward-compatible alias. Existing imports using the plural
 * name can continue working.
 */
export const businessPartnersApi = businessPartnerApi;
