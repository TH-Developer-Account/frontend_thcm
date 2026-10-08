import { useCallback, useEffect, useMemo, useState } from "react";

import { useReimbursementClaimListQuery } from "./useReimbursementClaimQueries";
import type { ReimbursementListingTab } from "./reimbursementClaim.types";
import { useDebouncedValue } from "../../medicalReimbursment/hooks/useDebouncedValue";

interface UseReimbursementClaimListingOptions {
	initialTab?: ReimbursementListingTab;
	initialPageSize?: number;
}

/** Guest claim list — search + pagination are server-side. */
export const useReimbursementClaimListing = ({
	initialTab = "createdByMe",
	initialPageSize = 25,
}: UseReimbursementClaimListingOptions = {}) => {
	const [tab, setTab] = useState<ReimbursementListingTab>(initialTab);
	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(initialPageSize);

	const debouncedSearch = useDebouncedValue(search.trim());

	useEffect(() => {
		setPageIndex(0);
	}, [debouncedSearch]);

	const params = useMemo(
		() => ({
			tab,
			search: debouncedSearch || undefined,
			pageIndex,
			pageSize,
		}),
		[tab, debouncedSearch, pageIndex, pageSize],
	);

	const query = useReimbursementClaimListQuery(params);

	const handleTabChange = useCallback((value: ReimbursementListingTab) => {
		setTab(value);
		setPageIndex(0);
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value.slice(0, 100));
	}, []);

	const handlePageSizeChange = useCallback((value: number) => {
		setPageSize(value);
		setPageIndex(0);
	}, []);

	return {
		tab,
		search,
		pageIndex,
		pageSize,
		rows: query.data?.items ?? [],
		total: query.data?.total ?? 0,
		pageCount: query.data?.totalPages ?? 0,
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
