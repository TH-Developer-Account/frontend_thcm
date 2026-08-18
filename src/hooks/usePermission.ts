// ─────────────────────────────────────────────────────────────────────────────
// hooks/usePermission.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shorthand hook for a specific app + module pair.
// Use this inside any page/component that belongs to one module.
//
// Usage:
//   const { canRead, canWrite, isReadOnly } = usePermission("MAP", "EPC");

import { useAuth } from "../context/Auth/AuthContext";

export function usePermission(appKey: string, moduleKey: string) {
  const { can, isSuperAdmin } = useAuth();

  const canRead = can("read", appKey, moduleKey);
  const canWrite = can("write", appKey, moduleKey);

  return {
    canRead,
    canWrite,
    isSuperAdmin,
    isReadOnly: canRead && !canWrite, // can see but not change
    hasNoAccess: !canRead && !canWrite, // shouldn't even be on this page
  };
}
