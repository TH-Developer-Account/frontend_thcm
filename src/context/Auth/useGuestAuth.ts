import { useContext } from "react";
import { GuestAuthContext } from "./GuestAuthContext";
import type { GuestAuthContextType } from "./GuestAuthContext";

export function useGuestAuth(): GuestAuthContextType {
  const context = useContext(GuestAuthContext);

  if (!context) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }

  return context;
}
