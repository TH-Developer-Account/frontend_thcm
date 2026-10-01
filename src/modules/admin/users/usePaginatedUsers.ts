import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useDebounce } from "../../../hooks/useDebounce";
import { userApi, userKeys } from "./users.api";

import type { User, UserListFilters } from "./user-management.types";

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 10;
// Short, so a revisited page reflects recent edits without a manual refresh.
const USER_PAGE_STALE_TIME_MS = 30 * 1000;
const NO_USERS: User[] = [];

type UsePaginatedUsersOptions = {
  filters?: UserListFilters;
  enabled?: boolean;
};

// Server-side paging + search for any screen that lists workspace users.
// `tablePagination` uses ManagementTable's prop names so callers spread it.
export const usePaginatedUsers = ({
  filters = {},
  enabled = true,
}: UsePaginatedUsersOptions = {}) => {
  const [search, setSearchValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeValue] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const params = { ...filters, search: debouncedSearch, pageIndex, pageSize };

  const query = useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => userApi.listUsers({ ...params, signal }),
    enabled,
    staleTime: USER_PAGE_STALE_TIME_MS,
    // Keeps the old page on screen while the next loads; without it the
    // total drops to 0 mid-fetch and ManagementTable snaps back to page 1.
    placeholderData: keepPreviousData,
  });

  // A new search or page size makes the current page index meaningless.
  const setSearch = (value: string) => {
    setSearchValue(value);
    setPageIndex(0);
  };

  const setPageSize = (size: number) => {
    setPageSizeValue(size);
    setPageIndex(0);
  };

  return {
    search,
    setSearch,
    resetPage: () => setPageIndex(0),
    query,
    rows: query.data?.rows ?? NO_USERS,
    statusCounts: query.data?.statusCounts,
    tablePagination: {
      pageIndex,
      pageSize,
      totalRowCount: query.data?.totalCount ?? 0,
      onPageChange: setPageIndex,
      onPageSizeChange: setPageSize,
    },
  };
};
