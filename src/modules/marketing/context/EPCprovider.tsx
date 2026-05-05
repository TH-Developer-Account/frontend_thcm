import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { EPCContext } from "./EPCcontext";
import { ServerAxios } from "../../../services/ServerAxios";
import { epc_api_routes, type EpcListFilterValue } from "../constant";
import type { ReactNode } from "react";
import type { EPCRow } from "../../../utils/types";
import type { SortingState } from "@tanstack/react-table";

interface EPCProviderProps {
  children: ReactNode;
}

export function EPCProvider({ children }: EPCProviderProps) {
  const [data, setData] = useState<EPCRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- SERVER STATE ---------- */
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<EpcListFilterValue>("createdByMe");

  const [totalPages, setTotalPages] = useState(0);
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  const fetchEPC = useCallback(async () => {
    try {
      setLoading(true);

      let sort = {
        id: "created_at",
        desc: true,
      };

      if (sorting.length) sort = sorting[0];

      const response = await ServerAxios.get(epc_api_routes.epc_listing_route, {
        params: {
          page: pageIndex + 1,
          pageSize,
          search: debouncedSearch,
          sortBy: sort?.id,
          sortOrder: sort?.desc ? "desc" : "asc",
          approvedByMe: selectedFilter === "approvedByMe",
          pendingOnMe: selectedFilter === "pendingOnMe",
        },
      });

      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch EPC data", error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedSearch, sorting, selectedFilter]);

  useEffect(() => {
    fetchEPC();
  }, [fetchEPC]);

  return (
    <EPCContext.Provider
      value={{
        data,
        loading,
        search,
        pageIndex,
        pageSize,
        totalPages,
        sorting,
        selectedFilter,
        setSelectedFilter,
        setSearch,
        setSorting,
        setPageIndex,
        setPageSize,
        refetch: fetchEPC,
      }}
    >
      {children}
    </EPCContext.Provider>
  );
}
