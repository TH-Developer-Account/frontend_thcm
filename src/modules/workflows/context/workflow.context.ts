import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SortingState } from "@tanstack/react-table";

import type { Option } from "../../../components/forms/input.types";
import type { WorkflowRow } from "../types/types";

export type WorkflowListScope = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";

export interface WorkflowContextValue {
	data: WorkflowRow[];
	setData: Dispatch<SetStateAction<WorkflowRow[]>>;

	loading: boolean;

	search: string;
	setSearch: Dispatch<SetStateAction<string>>;

	scope: WorkflowListScope;
	setScope: Dispatch<SetStateAction<WorkflowListScope>>;

	pageIndex: number;
	pageSize: number;
	totalPages: number;

	setPageIndex: Dispatch<SetStateAction<number>>;
	setPageSize: Dispatch<SetStateAction<number>>;

	sorting: SortingState;
	setSorting: Dispatch<SetStateAction<SortingState>>;

	filters: Record<string, Option[]>;
	setFilters: Dispatch<SetStateAction<Record<string, Option[]>>>;

	refetch: () => Promise<void>;
}

export const WorkflowContext = createContext<WorkflowContextValue | undefined>(
	undefined,
);
