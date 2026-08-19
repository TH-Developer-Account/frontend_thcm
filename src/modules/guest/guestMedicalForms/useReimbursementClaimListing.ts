import { useCallback, useMemo, useState } from "react";

import { useReimbursementClaimListQuery } from "./useReimbursementClaimQueries";
import type { ReimbursementListingTab } from "./reimbursementClaim.types";

interface UseReimbursementClaimListingOptions {
	initialTab?: ReimbursementListingTab;
	initialPageSize?: number;
}

export const useReimbursementClaimListing = ({
	initialTab = "createdByMe",
	initialPageSize = 25,
}: UseReimbursementClaimListingOptions = {}) => {
	const [tab, setTab] = useState<ReimbursementListingTab>(initialTab);

	const [search, setSearch] = useState("");

	const [pageIndex, setPageIndex] = useState(0);

	const [pageSize, setPageSize] = useState(initialPageSize);

	const params = useMemo(
		() => ({
			tab,
			search: search.trim() || undefined,
			pageIndex,
			pageSize,
		}),
		[tab, search, pageIndex, pageSize],
	);

	const query = useReimbursementClaimListQuery(params);

	const handleTabChange = useCallback((value: ReimbursementListingTab) => {
		setTab(value);
		setPageIndex(0);
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value);
		setPageIndex(0);
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

		pageCount: query.data?.totalPages ?? 0,

		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,

		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		setPageIndex,
	};
};
