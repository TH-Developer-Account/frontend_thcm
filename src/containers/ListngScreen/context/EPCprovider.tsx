import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EPFContext } from "./EPCcontext";
import { epfData as initialData } from "../data";
import type { EPCRow } from "../types";

interface EPFProviderProps {
  children: ReactNode;
}

export function EPFProvider({ children }: EPFProviderProps) {
  const [data, setData] = useState<EPCRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status ? item.status === status : true;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  return (
    <EPFContext.Provider
      value={{
        data,
        filteredData,
        search,
        status,
        setSearch,
        setStatus,
        setData,
      }}
    >
      {children}
    </EPFContext.Provider>
  );
}
