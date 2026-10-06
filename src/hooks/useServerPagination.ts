import { useCallback, useEffect, useState } from "react";

import { useDebounce } from "./useDebounce";

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 10;

// Search text + page state shared by every server-paginated list. A new search
// or page size makes the current page index meaningless, so both reset it.
export const useServerPagination = (defaultPageSize = DEFAULT_PAGE_SIZE) => {
  const [search, setSearchValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeValue] = useState(defaultPageSize);
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const resetPage = useCallback(() => setPageIndex(0), []);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPageIndex(0);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeValue(size);
    setPageIndex(0);
  }, []);

  return {
    search,
    debouncedSearch,
    pageIndex,
    pageSize,
    setSearch,
    setPageIndex,
    setPageSize,
    resetPage,
  };
};

export type ServerPagination = ReturnType<typeof useServerPagination>;

// Props in ManagementTable's names, so callers can spread them.
export type TablePagination = {
  pageIndex: number;
  pageSize: number;
  totalRowCount: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const toTablePagination = (
  pagination: ServerPagination,
  totalRowCount: number,
): TablePagination => ({
  pageIndex: pagination.pageIndex,
  pageSize: pagination.pageSize,
  totalRowCount,
  onPageChange: pagination.setPageIndex,
  onPageSizeChange: pagination.setPageSize,
});

// Deleting the last row of the last page leaves the index past the end;
// step back to the new last page instead of showing an empty table.
export const useClampPageToTotal = (
  pagination: ServerPagination,
  totalRowCount: number | undefined,
) => {
  const { pageIndex, pageSize, setPageIndex } = pagination;

  useEffect(() => {
    if (totalRowCount === undefined || totalRowCount === 0) return;
    const lastPageIndex = Math.ceil(totalRowCount / pageSize) - 1;
    if (pageIndex > lastPageIndex) setPageIndex(lastPageIndex);
  }, [pageIndex, pageSize, totalRowCount, setPageIndex]);
};
