// modules/guest/hooks/useGuestVendorSubmissionsListing.ts

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { guestVendorOnboardingApi } from "./api/guestVendorOnboarding.api";

import type { VendorOnboardingListingRow } from "../../vendorOnboarding/types/vendorListing.types";
import {
	canGuestEditVendorOnboarding,
	guestVendorQueryKeys,
} from "./guestVendorOnboarding.config";

const normalizeSearchValue = (value: string | null | undefined): string =>
	value?.trim().toLocaleLowerCase() ?? "";

const matchesSearch = (
	row: VendorOnboardingListingRow,
	search: string,
): boolean => {
	if (!search) return true;

	const searchableValues = [
		row.referenceNumber,
		row.vendorName,
		row.vendorType,
		row.companyCode,
		row.status,
		row.createdDate,
		row.initiatedBy?.first_name,
		row.initiatedBy?.last_name,
		[row.initiatedBy?.first_name, row.initiatedBy?.last_name]
			.filter(Boolean)
			.join(" "),
	];

	return searchableValues.some((value) =>
		normalizeSearchValue(value).includes(search),
	);
};

export const useGuestVendorSubmissionsListing = () => {
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);

	const query = useQuery({
		queryKey: guestVendorQueryKeys.listing(),
		queryFn: guestVendorOnboardingApi.getAll,

		/*
		 * Do not keep guest data fresh indefinitely on shared devices.
		 * The configured GuestAxios interceptor should clear cached query
		 * data when the guest logs out.
		 */
		staleTime: 30_000,
		retry: 1,
		refetchOnWindowFocus: false,
	});

	const normalizedSearch = useMemo(
		() => normalizeSearchValue(deferredSearch),
		[deferredSearch],
	);

	const rows = useMemo(
		() =>
			(query.data ?? []).filter((row) => matchesSearch(row, normalizedSearch)),
		[normalizedSearch, query.data],
	);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value);
	}, []);

	const clearSearch = useCallback(() => {
		setSearch("");
	}, []);

	const canGuestEdit = useCallback(
		(row: VendorOnboardingListingRow): boolean =>
			canGuestEditVendorOnboarding(row?.status),
		[],
	);

	return {
		rows,
		search,
		setSearch: handleSearchChange,
		clearSearch,
		canGuestEdit,

		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
};
