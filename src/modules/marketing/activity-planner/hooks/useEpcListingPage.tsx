import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import { useDebouncedValue } from "./useDebouncedValue";
import { useEpcListQuery } from "../queries/useEpcListQuery";
import type { EpcListFilter } from "../utils/constants";
import type { EpcListParams, EpcFilters } from "../types/epc.types";

const DEFAULT_EPC_FILTER: EpcListFilter = "createdByMe";
const VALID_EPC_FILTERS: EpcListFilter[] = [
  "createdByMe",
  "pendingOnMe",
  "approvedByMe",
];

const toNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getFilterValue = (value: string | null): EpcListFilter => {
  if (VALID_EPC_FILTERS.includes(value as EpcListFilter))
    return value as EpcListFilter;
  return DEFAULT_EPC_FILTER;
};

export const useEpcListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);

  const page = toNumber(searchParams.get("page"), 1);
  const limit = toNumber(searchParams.get("limit"), 15);
  const urlSearch = searchParams.get("search") || "";
  const selectedFilter = getFilterValue(searchParams.get("filter"));

  // ✅ All filters read from URL
  const filters = React.useMemo<EpcFilters>(
    () => ({
      status: searchParams.get("status")?.split(",").filter(Boolean) ?? [],
      zone: searchParams.get("zone")?.split(",").filter(Boolean) ?? [],
      eventType:
        searchParams.get("eventType")?.split(",").filter(Boolean) ?? [],
      eventDateFrom: searchParams.get("eventDateFrom") ?? "",
      eventDateTo: searchParams.get("eventDateTo") ?? "",
      createdDate: searchParams.get("createdDate") ?? "",
    }),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const sortBy = sorting[0]?.id || "created_at";
  const sortOrder: "asc" | "desc" =
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

  const queryParams = React.useMemo<EpcListParams>(
    () => ({
      page,
      limit,
      search: urlSearch || undefined,
      sortBy,
      sortOrder,
      createdByMe: selectedFilter === "createdByMe" ? true : undefined,
      pendingOnMe: selectedFilter === "pendingOnMe" ? true : undefined,
      approvedByMe: selectedFilter === "approvedByMe" ? true : undefined,
      // ✅ spread all filters into query params
      status: filters.status.length ? filters.status : undefined,
      zone: filters.zone.length ? filters.zone : undefined,
      eventType: filters.eventType.length ? filters.eventType : undefined,
      eventDateFrom: filters.eventDateFrom || undefined,
      eventDateTo: filters.eventDateTo || undefined,
      createdDate: filters.createdDate || undefined,
    }),
    [page, limit, urlSearch, sortBy, sortOrder, selectedFilter, filters],
  );

  const query = useEpcListQuery(queryParams);

  const handleFilterChange = (value: EpcListFilter) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("filter", value);
      next.set("page", "1");
      return next;
    });
  };

  // ✅ Single handler for all advanced filters
  const handleAdvancedFilterChange = (updated: Partial<EpcFilters>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const merged = { ...filters, ...updated };

        // array filters
        for (const key of ["status", "zone", "eventType"] as const) {
          if (merged[key].length) next.set(key, merged[key].join(","));
          else next.delete(key);
        }

        // date filters
        for (const key of [
          "eventDateFrom",
          "eventDateTo",
          "createdDate",
        ] as const) {
          if (merged[key]) next.set(key, merged[key]);
          else next.delete(key);
        }

        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  const handleClearAllFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of [
          "status",
          "zone",
          "eventType",
          "eventDateFrom",
          "eventDateTo",
          "createdDate",
        ]) {
          next.delete(key);
        }
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
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

  const activeFilterCount = [
    filters.status.length > 0,
    filters.zone.length > 0,
    filters.eventType.length > 0,
    !!filters.eventDateFrom || !!filters.eventDateTo,
    !!filters.createdDate,
  ].filter(Boolean).length;

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,

    searchInput,
    setSearchInput,

    selectedFilter,
    handleFilterChange,

    filters,
    handleAdvancedFilterChange,
    handleClearAllFilters,
    activeFilterCount,

    sorting,
    setSorting,

    pageIndex: page - 1,
    pageSize: limit,
    pageCount: query.data?.totalPages ?? 1,

    handlePageChange,
    handlePageSizeChange,
  };
};
