import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
	businessPartnerApi,
	businessPartnerKeys,
} from "../api/businessPartner.api";

import {
	mapBusinessPartnerView,
	normalizeListingParams,
} from "../utils/businessPartner.mapper";

import type { BusinessPartnerListingParams } from "../utils/bp.types";

const BUSINESS_PARTNER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const useBusinessPartnerListing = (
	params: BusinessPartnerListingParams = {},
) => {
	const normalizedParams = normalizeListingParams(params);

	return useQuery({
		queryKey: businessPartnerKeys.list(normalizedParams),
		queryFn: () => businessPartnerApi.list(normalizedParams),
		placeholderData: keepPreviousData,
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

export const useBusinessPartner = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => businessPartnerApi.getById(normalizedId),
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};

export const useBusinessPartnerView = (businessPartnerId?: string | null) => {
	const normalizedId = businessPartnerId?.trim() ?? "";

	return useQuery({
		queryKey: businessPartnerKeys.detail(normalizedId),
		queryFn: () => businessPartnerApi.getById(normalizedId),
		select: mapBusinessPartnerView,
		enabled: Boolean(normalizedId),
		...BUSINESS_PARTNER_QUERY_OPTIONS,
	});
};
