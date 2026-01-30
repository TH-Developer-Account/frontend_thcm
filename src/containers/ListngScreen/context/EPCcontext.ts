import { createContext } from "react";
import type { EPCRow } from "../types";

export interface EPFContextValue {
  data: EPCRow[];
  filteredData: EPCRow[];
  search: string;
  status: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setData: React.Dispatch<React.SetStateAction<EPCRow[]>>;
}

export const EPFContext = createContext<EPFContextValue | undefined>(undefined);
