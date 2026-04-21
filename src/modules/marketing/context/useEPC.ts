import { useContext } from "react";
import { EPCContext } from "./EPCcontext";
import type { EPCContextValue } from "./EPCcontext";

export function useEPC(): EPCContextValue {
  const context = useContext(EPCContext);

  if (!context) {
    throw new Error("useEPC must be used inside EPCProvider");
  }

  return context;
}
