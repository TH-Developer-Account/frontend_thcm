import { createContext } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { WorkflowCard } from "../types/workflow.types";
import type { Option } from "../../../../components/FormElements/input.types";

export interface WorkflowContextValue {
  data: WorkflowCard[];
  setData: React.Dispatch<React.SetStateAction<WorkflowCard[]>>;
  loading: boolean;
  search: string;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  sorting: SortingState;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  refetch: () => Promise<void>;
  filters: Record<string, Option[]>;
  setFilters: React.Dispatch<React.SetStateAction<Record<string, Option[]>>>;
}

export const WorkflowContext = createContext<WorkflowContextValue | undefined>(
  undefined,
);
