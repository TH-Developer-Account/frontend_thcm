import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { medicalClaimApi } from "../api/medicalClaim.api";
import { medicalClaimKeys } from "../hooks/useMedicalClaimMutations";
import type {
	MedicalClaimListingParams,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	React.useEffect(() => {
		const timeoutId = window.setTimeout(
			() => setDebouncedValue(value),
			delayMs,
		);
		return () => window.clearTimeout(timeoutId);
	}, [delayMs, value]);

	return debouncedValue;
};

type UseMedicalClaimListingParams = {
	initialTab?: MedicalClaimListingTab;
};

export const useMedicalClaimListing = ({
	initialTab = "claims",
}: UseMedicalClaimListingParams = {}) => {
	const [tab, setTab] = useState<MedicalClaimListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
	const queryParams = useMemo<MedicalClaimListingParams>(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			pageIndex,
			pageSize,
		}),
		[debouncedSearch, pageIndex, pageSize, tab],
	);

	const listingQuery = useQuery({
		queryKey: [...medicalClaimKeys.lists(), queryParams],
		queryFn: () => medicalClaimApi.listMedicalClaims(queryParams),
		placeholderData: (previousData) => previousData,
	});

	const totalCount = listingQuery.data?.totalCount ?? 0;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

	React.useEffect(() => {
		if (pageIndex > pageCount - 1) setPageIndex(Math.max(0, pageCount - 1));
	}, [pageCount, pageIndex]);

	const handleTabChange = React.useCallback(
		(nextTab: MedicalClaimListingTab) => {
			setTab(nextTab);
			setPageIndex(0);
			setSearch("");
		},
		[],
	);

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
		refetch: listingQuery.refetch,
		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
