import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import { useDebouncedValue } from "./useDebouncedValue";
import { useEpcListQuery } from "../queries/useEpcListQuery";
import type { EpcListFilter } from "../utils/constants";

const DEFAULT_EPC_FILTER: EpcListFilter = "createdByMe";

const toNumber = (value: string | null, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getFilterValue = (value: string | null): EpcListFilter => {
	if (value === "all" || value === "createdByMe" || value === "approvalsByMe") {
		return value;
	}

	return DEFAULT_EPC_FILTER;
};

export const useEpcListingPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [sorting, setSorting] = useState<SortingState>([]);

	const page = toNumber(searchParams.get("page"), 1);
	const limit = toNumber(searchParams.get("limit"), 10);
	const urlSearch = searchParams.get("search") || "";
	const status = searchParams.get("status") || "";
	const selectedFilter = getFilterValue(searchParams.get("filter"));

	const [searchInput, setSearchInput] = useState(urlSearch);
	const debouncedSearch = useDebouncedValue(searchInput, 350);

	const sortBy = sorting[0]?.id || "created_at";
	const sortOrder =
		sorting.length === 0 ? "desc" : sorting[0]?.desc ? "desc" : "asc";

	React.useEffect(() => {
		const trimmedSearch = debouncedSearch.trim();

		if (trimmedSearch === urlSearch) return;

		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);

				if (trimmedSearch) next.set("search", trimmedSearch);
				else next.delete("search");

				next.set("page", "1");

				return next;
			},
			{ replace: true },
		);
	}, [debouncedSearch, urlSearch, setSearchParams]);

	const isCreatedByMeFilter = selectedFilter === "createdByMe";
	const isApprovalsByMeFilter = selectedFilter === "approvalsByMe";

	const query = useEpcListQuery({
		page,
		limit,
		search: urlSearch || undefined,
		status: status || undefined,
		sortBy,
		sortOrder,

		createdByMe: isCreatedByMeFilter ? true : undefined,
		approvalsByMe: isApprovalsByMeFilter ? true : undefined,
	});

	const handleFilterChange = (value: EpcListFilter) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.set("filter", value);
			next.set("page", "1");

			next.delete("createdByMe");
			next.delete("approvalsByMe");

			return next;
		});
	};

	const handlePageChange = (nextPageIndex: number) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.set("page", String(nextPageIndex + 1));

			return next;
		});
	};

	const handlePageSizeChange = (nextPageSize: number) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);

			next.set("limit", String(nextPageSize));
			next.set("page", "1");

			return next;
		});
	};

	return {
		data: query.data,
		isLoading: query.isLoading,
		isFetching: query.isFetching,

		searchInput,
		setSearchInput,

		selectedFilter,
		handleFilterChange,

		sorting,
		setSorting,

		pageIndex: page - 1,
		pageSize: limit,
		pageCount: query.data?.totalPages ?? 1,

		handlePageChange,
		handlePageSizeChange,
	};
};
