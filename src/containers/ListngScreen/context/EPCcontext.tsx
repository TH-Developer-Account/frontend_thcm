import { createContext, useContext, useMemo, useState } from "react";
import { epfData as initialData } from "../data";

const EPFContext = createContext(null);

export function EPFProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // derived state
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status ? item.status === status : true;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  const value = {
    data,
    filteredData,

    // filters
    search,
    status,

    // actions
    setSearch,
    setStatus,
    setData,
  };

  return <EPFContext.Provider value={value}>{children}</EPFContext.Provider>;
}

// custom hook (important)
export function useEPC() {
  const context = useContext(EPFContext);
  if (!context) {
    throw new Error("useEPC must be used inside EPFProvider");
  }
  return context;
}
