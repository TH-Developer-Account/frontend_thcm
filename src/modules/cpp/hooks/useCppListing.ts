import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { cppApi } from "../api/cpp.api";
import { cppKeys } from "./useCppMutations";
// Shared hook today lives in the medical module; move it to src/hooks later.
import { useDebouncedValue } from "../../medicalReimbursment/hooks/useDebouncedValue";
import type {
	CppListingParams,
	CppListingTab,
	CppStatusFilter,
} from "../types/cpp.types";
import { getCppStatusOptionsForTab } from "../utils/cpp.constants";

const DEFAULT_PAGE_SIZE = 10;

export const useCppListing = ({
	initialTab = "myRequests",
}: { initialTab?: CppListingTab } = {}) => {
	const [tab, setTab] = useState<CppListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<CppStatusFilter>("all");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const debouncedSearch = useDebouncedValue(search.trim());

	const queryParams = useMemo<CppListingParams>(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			status: status === "all" ? undefined : status,
			pageIndex,
			pageSize,
		}),
		[debouncedSearch, pageIndex, pageSize, status, tab],
	);

	const listingQuery = useQuery({
		queryKey: [...cppKeys.lists(), queryParams],
		queryFn: () => cppApi.list(queryParams),
		placeholderData: keepPreviousData,
		staleTime: 15_000,
		refetchOnWindowFocus: false,
		retry: 1,
	});

	const totalCount = listingQuery.data?.totalCount ?? 0;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const rows = listingQuery.data?.rows ?? [];

	useEffect(() => {
		setPageIndex(0);
	}, [debouncedSearch]);

	useEffect(() => {
		const lastPageIndex = Math.max(0, pageCount - 1);
		if (!listingQuery.isFetching && pageIndex > lastPageIndex) {
			setPageIndex(lastPageIndex);
		}
	}, [listingQuery.isFetching, pageCount, pageIndex]);

	const statusOptions = useMemo(() => getCppStatusOptionsForTab(tab), [tab]);

	const handleTabChange = useCallback(
		(nextTab: CppListingTab) => {
			if (nextTab === tab) return;
			setTab(nextTab);
			setSearch("");
			setStatus("all");
			setPageIndex(0);
		},
		[tab],
	);

	const handleSearchChange = useCallback((next: string) => {
		setSearch(next.slice(0, 100));
	}, []);

	const handleStatusChange = useCallback((next: CppStatusFilter) => {
		setStatus(next || "all");
		setPageIndex(0);
	}, []);

	const handlePageSizeChange = useCallback((next: number) => {
		setPageSize(next);
		setPageIndex(0);
	}, []);

	return {
		tab,
		search,
		status,
		statusOptions,
		pageIndex,
		pageSize,
		pageCount,
		totalCount,
		rows,
		isLoading: listingQuery.isLoading,
		isFetching: listingQuery.isFetching,
		isError: listingQuery.isError,
		error: listingQuery.error,
		refetch: listingQuery.refetch,
		handleTabChange,
		handleSearchChange,
		handleStatusChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
