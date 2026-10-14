import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  toTablePagination,
  useClampPageToTotal,
  useServerPagination,
} from "../../../hooks/useServerPagination";
import { userApi, userKeys } from "./users.api";

import type { User, UserListFilters } from "./user-management.types";

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
  const pagination = useServerPagination();
  const { search, setSearch, resetPage, debouncedSearch, pageIndex, pageSize } =
    pagination;

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

  useClampPageToTotal(pagination, query.data?.totalCount);

  return {
    search,
    setSearch,
    resetPage,
    query,
    rows: query.data?.rows ?? NO_USERS,
    statusCounts: query.data?.statusCounts,
    tablePagination: toTablePagination(pagination, query.data?.totalCount ?? 0),
  };
};
