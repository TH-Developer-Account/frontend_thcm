import { createContext } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { EPCRow } from "../../../../../utils/types";

export interface EPFContextValue {
	data: EPCRow[];
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
}

export const EPFContext = createContext<EPFContextValue | undefined>(undefined);
