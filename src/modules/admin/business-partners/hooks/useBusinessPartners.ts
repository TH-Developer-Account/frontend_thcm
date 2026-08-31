import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ServerAxios } from "../../../../services/ServerAxios";

import type {
	BusinessPartner,
	BusinessPartnerListingParams,
	BusinessPartnerListResponse,
	BusinessPartnerListingResult,
} from "../utils/bp.types";

const API_URL = "/bp";
const DEFAULT_PAGE_SIZE = 10;

export type CreateBusinessPartnerPayload = Omit<BusinessPartner, "id">;
export type UpdateBusinessPartnerPayload =
	Partial<CreateBusinessPartnerPayload>;

type ApiEnvelope<T> = {
	data: T;
};

const unwrapData = <T>(response: T | ApiEnvelope<T>): T => {
	if (typeof response === "object" && response !== null && "data" in response) {
		return response.data;
	}

	return response;
};

export const businessPartnerKeys = {
	all: ["business-partners"] as const,
	lists: () => [...businessPartnerKeys.all, "list"] as const,
	list: (params: Required<BusinessPartnerListingParams>) =>
		[...businessPartnerKeys.lists(), params] as const,
	details: () => [...businessPartnerKeys.all, "detail"] as const,
	detail: (businessPartnerId: string) =>
		[...businessPartnerKeys.details(), businessPartnerId] as const,
};

const normalizeListingParams = (
	params: BusinessPartnerListingParams,
): Required<BusinessPartnerListingParams> => ({
	search: params.search?.trim() ?? "",
	status: params.status ?? [],
	zone: params.zone ?? [],
	pageIndex: params.pageIndex ?? 0,
	pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
});

const fetchBusinessPartners = async (
	params: Required<BusinessPartnerListingParams>,
): Promise<BusinessPartnerListingResult> => {
	const response = await ServerAxios.get<BusinessPartnerListResponse>(API_URL, {
		params: {
			search: params.search || undefined,
			status: params.status.length > 0 ? params.status : undefined,
			zone: params.zone.length > 0 ? params.zone : undefined,
			page_index: params.pageIndex,
			page_size: params.pageSize,
		},
	});

	const body = response.data;
	const rows = Array.isArray(body) ? body : (body.rows ?? body.data ?? []);

	return {
		rows,
		totalCount: Array.isArray(body)
			? rows.length
			: (body.totalCount ?? body.total ?? rows.length),
		pageIndex: Array.isArray(body)
			? params.pageIndex
			: (body.page_index ?? params.pageIndex),
		pageSize: Array.isArray(body)
			? params.pageSize
			: (body.page_size ?? params.pageSize),
	};
};

const fetchBusinessPartner = async (
	businessPartnerId: string,
): Promise<BusinessPartner> => {
	const response = await ServerAxios.get<
		BusinessPartner | ApiEnvelope<BusinessPartner>
	>(`${API_URL}/${encodeURIComponent(businessPartnerId)}`);

	return unwrapData(response.data);
};

export const useBusinessPartnerListing = (
	params: BusinessPartnerListingParams = {},
) => {
	const normalizedParams = normalizeListingParams(params);

	return useQuery({
		queryKey: businessPartnerKeys.list(normalizedParams),
		queryFn: () => fetchBusinessPartners(normalizedParams),
		placeholderData: (previousData) => previousData,
	});
};

export const useBusinessPartner = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => fetchBusinessPartner(normalizedId),
		enabled: Boolean(normalizedId),
	});
};

export const useBusinessPartnerMutations = () => {
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: async (payload: CreateBusinessPartnerPayload) => {
			const response = await ServerAxios.post<
				BusinessPartner | ApiEnvelope<BusinessPartner>
			>(API_URL, payload);

			return unwrapData(response.data);
		},
		onSuccess: (createdPartner) => {
			queryClient.setQueryData(
				businessPartnerKeys.detail(createdPartner.id),
				createdPartner,
			);
			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			businessPartnerId,
			payload,
		}: {
			businessPartnerId: string;
			payload: UpdateBusinessPartnerPayload;
		}) => {
			const response = await ServerAxios.patch<
				BusinessPartner | ApiEnvelope<BusinessPartner>
			>(`${API_URL}/${encodeURIComponent(businessPartnerId)}`, payload);

			return unwrapData(response.data);
		},
		onSuccess: (updatedPartner) => {
			queryClient.setQueryData(
				businessPartnerKeys.detail(updatedPartner.id),
				updatedPartner,
			);
			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (businessPartnerId: string) => {
			await ServerAxios.delete(
				`${API_URL}/${encodeURIComponent(businessPartnerId)}`,
			);

			return businessPartnerId;
		},
		onSuccess: (deletedPartnerId) => {
			queryClient.removeQueries({
				queryKey: businessPartnerKeys.detail(deletedPartnerId),
			});
			void queryClient.invalidateQueries({
				queryKey: businessPartnerKeys.lists(),
			});
		},
	});

	return {
		createBusinessPartner: createMutation.mutateAsync,
		updateBusinessPartner: updateMutation.mutateAsync,
		deleteBusinessPartner: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,
	};
};
