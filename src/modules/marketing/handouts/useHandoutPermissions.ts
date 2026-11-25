// handouts/useHandoutPermissions.ts
// Page-level gates (which tabs / buttons exist at all) — one RBAC module
// (HANDOUT_MODULE) for the whole feature:
//   read  → open Handouts, see your own requests
//   write → raise requests, approve, AND deliver (not separately grantable)
//
// Per-request actions (approve, reject, clarify, cancel, resubmit, deliver,
// can't fulfil) are decided by the `permissions` flags on GET /handouts/:id,
// which narrow a write grant further by the request's own status — the
// backend remains the real gate. This hook only decides which pages/tabs/
// buttons exist at all, same pattern as useArtworkPermissions.

import { useAuth } from "../../../context/Auth/AuthContext";
import { usePermission } from "../../../hooks/usePermission";
import { HANDOUT_APP, HANDOUT_MODULE } from "./handouts.constants";

export function useHandoutPermissions() {
  const { canReadApp } = useAuth();
  const hasMapAccess = canReadApp(HANDOUT_APP);

  const { canRead, canWrite } = usePermission(HANDOUT_APP, HANDOUT_MODULE);

  return {
    /** Sees the Handouts button and page at all. */
    canOpenHandouts: hasMapAccess && (canRead || canWrite),
    /** "My requests" tab + "New handout request" button + the new page. */
    canRequest: canWrite,
    /** "To approve" tab. */
    canApprove: canWrite,
    /** "Pending to deliver" tab. */
    canDeliver: canWrite,
  };
}
