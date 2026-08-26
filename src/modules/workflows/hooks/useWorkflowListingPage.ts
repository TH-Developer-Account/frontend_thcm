import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SortingState } from "@tanstack/react-table";

import type { Option } from "../../../components/forms/input.types";
import { useAuth } from "../../../context/Auth/useAuth";
import { useDebounce } from "../../../hooks/useDebounce";

import { workflowListApi } from "../api/workflow.api";
import { formatApps } from "../constant/workflow.constant";
import type { WorkflowListScope, WorkflowRow } from "../types/types";
import { mapWorkflowRows } from "../utils/workflow-list.helpers";

const DEFAULT_FILTER: WorkflowListScope = "ALL";
const DEFAULT_PAGE_SIZE = 25;

const VALID_FILTERS: WorkflowListScope[] = [
  "ALL",
  "ASSIGNED_TO_ME",
  "CREATED_BY_ME",
];

const VALID_PAGE_SIZES = [5, 10, 15, 25, 50, 100];

const toPositiveNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPageSize = (value: string | null): number => {
  const parsed = Number(value);

  return VALID_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
};

const getListFilter = (value: string | null): WorkflowListScope => {
  if (VALID_FILTERS.includes(value as WorkflowListScope)) {
    return value as WorkflowListScope;
  }

  return DEFAULT_FILTER;
};

const getArraySearchParam = (
  searchParams: URLSearchParams,
  key: string,
): string[] =>
  searchParams
    .get(key)
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

const createSelectedOptions = (
  selectedIds: string[],
  availableOptions: Option[],
): Option[] =>
  selectedIds.map(
    (id) =>
      availableOptions.find((option) => option.value === id) ?? {
        value: id,
        label: id,
      },
  );

export const useWorkflowListingPage = () => {
  const { permissions, user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<WorkflowRow[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [refetchKey, setRefetchKey] = useState(0);

  const requestIdRef = useRef(0);

  const page = toPositiveNumber(searchParams.get("page"), 1);

  const pageSize = getPageSize(searchParams.get("limit"));

  const urlSearch = searchParams.get("search") ?? "";

  const selectedFilter = getListFilter(searchParams.get("filter"));

  const [searchInput, setSearchInput] = useState(urlSearch);

  const debouncedSearch = useDebounce(searchInput, 400);

  const appOptions = useMemo(() => formatApps(permissions), [permissions]);

  const createdByIds = useMemo(
    () => getArraySearchParam(searchParams, "createdBy"),
    [searchParams],
  );

  const appIds = useMemo(
    () => getArraySearchParam(searchParams, "apps"),
    [searchParams],
  );

  const filters = useMemo<Record<string, Option[]>>(
    () => ({
      createdBy: createSelectedOptions(createdByIds, users),
      apps: createSelectedOptions(appIds, appOptions),
    }),
    [appIds, appOptions, createdByIds, users],
  );

  const sortBy = sorting[0]?.id;

  const sortOrder: "asc" | "desc" | undefined =
    sorting.length === 0 ? undefined : sorting[0]?.desc ? "desc" : "asc";

  /*
   * Keep the text input synchronized when the user navigates backwards or
   * forwards through URL history.
   */
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  /*
   * Write the debounced search value into the URL.
   */
  useEffect(() => {
    const trimmedSearch = debouncedSearch.trim();

    if (trimmedSearch === urlSearch) return;

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (trimmedSearch) {
          next.set("search", trimmedSearch);
        } else {
          next.delete("search");
        }

        next.set("page", "1");

        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, setSearchParams, urlSearch]);

  /*
   * Load the Created By filter options.
   */
  useEffect(() => {
    let active = true;

    const fetchUsers = async (): Promise<void> => {
      try {
        const { workflowApi } = await import("../api/workflow.api");

        const options = await workflowApi.getUserOptions();

        if (!active) return;

        setUsers(Array.isArray(options) ? options : []);
      } catch (nextError) {
        if (!active) return;

        console.error("Failed to fetch workflow users", nextError);

        setUsers([]);
      }
    };

    void fetchUsers();

    return () => {
      active = false;
    };
  }, []);

  const fetchWorkflowList = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const response = await workflowListApi.list({
        page,
        pageSize,
        search: urlSearch || undefined,
        sortBy,
        sortOrder,
        filters: {
          createdBy: createdByIds,
          apps: appIds,
        },
        scope: selectedFilter,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const rows = mapWorkflowRows(response.data).map((workflow) => ({
        ...workflow,
        ownerType:
          user?.id === workflow.created_by_id
            ? ("USER" as const)
            : ("ADMIN" as const),
      }));

      setData(rows);
      setTotalPages(response.meta.totalPages);
    } catch (nextError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error("Failed to fetch workflow listing", nextError);

      setError(nextError);
      setData([]);
      setTotalPages(0);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    appIds,
    createdByIds,
    page,
    pageSize,
    selectedFilter,
    sortBy,
    sortOrder,
    urlSearch,
    user?.id,
  ]);

  useEffect(() => {
    void fetchWorkflowList();
  }, [fetchWorkflowList, refetchKey]);

  const handleFilterChange = useCallback(
    (value: WorkflowListScope) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        next.set("filter", value);
        next.set("page", "1");

        return next;
      });
    },
    [setSearchParams],
  );

  const handleAdvancedFilterChange = useCallback(
    ({ fieldName, value }: { fieldName?: string; value: Option[] }) => {
      if (!fieldName) return;

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          const selectedValues = value
            .map((option) => option.value)
            .filter(Boolean);

          if (selectedValues.length > 0) {
            next.set(fieldName, selectedValues.join(","));
          } else {
            next.delete(fieldName);
          }

          next.set("page", "1");

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (nextPageIndex: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        next.set("page", String(nextPageIndex + 1));

        return next;
      });
    },
    [setSearchParams],
  );

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        next.set("limit", String(nextPageSize));
        next.set("page", "1");

        return next;
      });
    },
    [setSearchParams],
  );

  const removeWorkflowFromList = useCallback((workflowId: string) => {
    setData((current) =>
      current.filter((workflow) => workflow.id !== workflowId),
    );
  }, []);

  const refetch = useCallback(() => {
    setRefetchKey((current) => current + 1);
  }, []);

  return {
    data,
    loading,
    error,

    users,
    appOptions,

    searchInput,
    setSearchInput,

    selectedFilter,
    handleFilterChange,

    filters,
    handleAdvancedFilterChange,

    sorting,
    setSorting,

    pageIndex: page - 1,
    pageSize,
    pageCount: Math.max(totalPages, 1),

    handlePageChange,
    handlePageSizeChange,

    removeWorkflowFromList,
    refetch,
  };
};
