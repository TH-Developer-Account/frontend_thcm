import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SortingState } from "@tanstack/react-table";

import type { Option } from "../../../components/forms/input.types";
import type { WorkflowRow } from "../types/types";

export interface WorkflowContextValue {
	data: WorkflowRow[];
	setData: Dispatch<SetStateAction<WorkflowRow[]>>;
	loading: boolean;
	search: string;
	pageIndex: number;
	pageSize: number;
	totalPages: number;
	sorting: SortingState;
	setSearch: Dispatch<SetStateAction<string>>;
	setSorting: Dispatch<SetStateAction<SortingState>>;
	setPageIndex: Dispatch<SetStateAction<number>>;
	setPageSize: Dispatch<SetStateAction<number>>;
	refetch: () => Promise<void>;
	filters: Record<string, Option[]>;
	setFilters: Dispatch<SetStateAction<Record<string, Option[]>>>;
}

export const WorkflowContext = createContext<WorkflowContextValue | undefined>(
	undefined,
);
