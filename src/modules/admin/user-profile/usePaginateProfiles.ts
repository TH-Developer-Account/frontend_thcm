import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  toTablePagination,
  useClampPageToTotal,
  useServerPagination,
} from "../../../hooks/useServerPagination";
import { profileApi, profileKeys } from "./profile.api";

import type { Profile } from "./types/profile.types";

const PROFILE_PAGE_STALE_TIME_MS = 30 * 1000;
const NO_PROFILES: Profile[] = [];

// Server-side paging + search for the profile list. The app filter lives here
// (not in the page) because changing it must send the table back to page 1.
export const usePaginatedProfiles = () => {
  const pagination = useServerPagination();
  const [appKey, setAppKeyValue] = useState("");
  const { search, setSearch, debouncedSearch, pageIndex, pageSize, resetPage } =
    pagination;

  const params = {
    appKey: appKey || undefined,
    search: debouncedSearch,
    pageIndex,
    pageSize,
  };

  const query = useQuery({
    queryKey: profileKeys.page(params),
    queryFn: ({ signal }) => profileApi.listPage({ ...params, signal }),
    staleTime: PROFILE_PAGE_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });

  useClampPageToTotal(pagination, query.data?.totalCount);

  const setAppKey = (nextAppKey: string) => {
    setAppKeyValue(nextAppKey);
    resetPage();
  };

  return {
    search,
    setSearch,
    appKey,
    setAppKey,
    query,
    rows: query.data?.rows ?? NO_PROFILES,
    tablePagination: toTablePagination(pagination, query.data?.totalCount ?? 0),
  };
};
