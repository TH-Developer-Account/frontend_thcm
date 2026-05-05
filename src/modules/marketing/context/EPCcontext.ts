import { createContext } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { EPCRow } from "../../../utils/types";
import type { EpcListFilterValue } from "../constant";

export interface EPCContextValue {
  data: EPCRow[];
  loading: boolean;
  search: string;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  sorting: SortingState;
  selectedFilter: EpcListFilterValue;
  setSelectedFilter: React.Dispatch<React.SetStateAction<EpcListFilterValue>>;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  refetch: () => Promise<void>;
}

export const EPCContext = createContext<EPCContextValue | undefined>(undefined);
