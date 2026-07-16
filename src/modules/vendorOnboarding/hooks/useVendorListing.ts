import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import type {
  VendorListingParams,
  VendorListingTab,
} from "../api/vendorOnboarding.api";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

// Small standalone debounce hook — reused wherever a search input needs to avoid
// firing a request on every keystroke. Kept generic (not vendor-specific) since
// nothing about it depends on vendor listing shape.
const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
};

type UseVendorListingParams = {
  initialTab?: VendorListingTab;
};

export const useVendorListing = ({
  initialTab = "initiation",
}: UseVendorListingParams = {}) => {
  const [tab, setTab] = useState<VendorListingTab>(initialTab);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const queryParams: VendorListingParams = useMemo(
    () => ({ tab, search: debouncedSearch, pageIndex, pageSize }),
    [tab, debouncedSearch, pageIndex, pageSize],
  );

  const listingQuery = useQuery({
    queryKey: ["vendor-onboarding-list", queryParams],
    queryFn: () => vendorOnboardingApi.listVendorOnboardings(queryParams),
    placeholderData: (previousData) => previousData, // keep prior page visible while refetching
  });

  const pageCount = Math.max(
    1,
    Math.ceil((listingQuery.data?.totalCount ?? 0) / pageSize),
  );

  // Any change to tab/search resets pagination — a stale pageIndex from one
  // tab/search context shouldn't silently carry over into another.
  const handleTabChange = (nextTab: VendorListingTab) => {
    setTab(nextTab);
    setPageIndex(0);
    setSearch("");
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    setPageIndex(0);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPageIndex(0);
  };

  return {
    tab,
    search,
    pageIndex,
    pageSize,
    pageCount,
    rows: listingQuery.data?.rows ?? [],
    isLoading: listingQuery.isLoading,
    isFetching: listingQuery.isFetching,
    isError: listingQuery.isError,
    handleTabChange,
    handleSearchChange,
    handlePageSizeChange,
    setPageIndex,
  };
};
