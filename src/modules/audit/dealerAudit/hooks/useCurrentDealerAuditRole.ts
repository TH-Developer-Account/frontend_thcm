import { useMemo } from "react";
import type { DealerAuditRole } from "../dealer-audit.types";
import { useAuth } from "../../../../context/Auth/useAuth";

// Dealer Audit's registered app/module keys — must match whatever the
// backend and sidebar.tsx use for this module's permission rows.
const DEALER_AUDIT_APP_KEY = "MAP";
const DEALER_AUDIT_MODULE_KEY = "DealerAudit";

/**
 * Bridges the app's generic {app, module, action} permission system onto
 * Dealer Audit's role model. This is a best-effort mapping, NOT a source
 * of truth — the real permission system has no explicit DEALER / REVIEWER /
 * APPROVER / AUDIT_MANAGER distinction, only read/write per module (and
 * app-scope admin via canManageApp).
 *
 * Until the backend adds a dedicated designation/role claim for Dealer
 * Audit, this can only reliably resolve:
 *  - Super admin OR app-scope manager of "MAP"        → ADMIN
 *  - Module "write" on DealerAudit                    → REVIEWER
 *    (write is currently our only signal for "can act on audits";
 *     it cannot distinguish a reviewer from a dealer appraiser)
 *  - Module "read" on DealerAudit                      → READ_ONLY
 *  - No relevant grant                                  → undefined (denied)
 *
 * TODO (confirm with backend/product): add a distinct permission action
 * or a user "designation" field so DEALER vs REVIEWER vs APPROVER vs
 * AUDIT_MANAGER can be told apart. Replace this function once that exists.
 */
export function useCurrentDealerAuditRole(): DealerAuditRole | undefined {
	const { isSuperAdmin, can, canManageApp } = useAuth();

	return useMemo(() => {
		// Super admin, or someone with app-scope "write" over the whole MAP
		// app (canManageApp already folds isSuperAdmin in, checked again
		// here only for clarity/readability, not because it's required).
		if (isSuperAdmin || canManageApp(DEALER_AUDIT_APP_KEY)) return "ADMIN";

		if (can("write", DEALER_AUDIT_APP_KEY, DEALER_AUDIT_MODULE_KEY)) {
			return "REVIEWER";
		}

		if (can("read", DEALER_AUDIT_APP_KEY, DEALER_AUDIT_MODULE_KEY)) {
			return "READ_ONLY";
		}

		// No grant on this module at all — fully denied.
		return undefined;
	}, [isSuperAdmin, can, canManageApp]);
}
