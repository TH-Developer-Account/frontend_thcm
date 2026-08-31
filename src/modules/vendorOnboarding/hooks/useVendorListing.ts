import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import type {
	VendorListingParams,
	VendorListingTab,
} from "../api/vendorOnboarding.api";
import { vendorOnboardingKeys } from "../queries/useVendorMutations";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	React.useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [delayMs, value]);

	return debouncedValue;
};

type UseVendorListingParams = {
	initialTab: VendorListingTab;
};

export const useVendorListing = ({ initialTab }: UseVendorListingParams) => {
	const [tab, setTab] = useState<VendorListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

	const queryParams = useMemo<VendorListingParams>(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			pageIndex,
			pageSize,
		}),
		[debouncedSearch, pageIndex, pageSize, tab],
	);

	const listingQuery = useQuery({
		queryKey: [...vendorOnboardingKeys.lists(), queryParams],
		queryFn: () => vendorOnboardingApi.listVendorOnboardings(queryParams),
		placeholderData: (previousData) => previousData,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const totalCount = listingQuery.data?.totalCount ?? 0;

	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

	const handleTabChange = React.useCallback((nextTab: VendorListingTab) => {
		setTab(nextTab);
		setPageIndex(0);
		setSearch("");
	}, []);

	const handleSearchChange = React.useCallback((nextSearch: string) => {
		setSearch(nextSearch);
		setPageIndex(0);
	}, []);

	const handlePageSizeChange = React.useCallback((nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	}, []);

	return {
		tab,
		search,
		pageIndex,
		pageSize,
		pageCount,
		totalCount,

		rows: listingQuery.data?.rows ?? [],

		isLoading: listingQuery.isLoading,
		isFetching: listingQuery.isFetching,
		isError: listingQuery.isError,
		error: listingQuery.error,

		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
