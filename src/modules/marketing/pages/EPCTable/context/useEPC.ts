import { useContext } from "react";
import { EPFContext } from "./EPCcontext";
import type { EPFContextValue } from "./EPCcontext";

export function useEPC(): EPFContextValue {
  const context = useContext(EPFContext);

  if (!context) {
    throw new Error("useEPC must be used inside EPFProvider");
  }

  return context;
}
