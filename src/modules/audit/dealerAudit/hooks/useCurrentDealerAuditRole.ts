import { useMemo } from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { resolveDealerAuditRole } from "../dealer-audit.access";
import type { DealerAuditRole } from "../dealer-audit.types";

// Dealer Audit's registered app/module keys — must match whatever the
// backend and sidebar.tsx use for this module's permission rows.
const DEALER_AUDIT_APP_KEY = "MAP";
const DEALER_AUDIT_MODULE_KEY = "DealerAudit";

export interface CurrentDealerAuditRole {
	role: DealerAuditRole | undefined;
	/** true while the session is still being restored — do not deny yet. */
	isLoading: boolean;
	userId: string | null;
	/**
	 * TODO(dealer-id): the User object carries no dealer id yet. Until the
	 * backend adds one, dealer scoping is enforced by the API alone.
	 */
	dealerId: string | null;
}

/**
 * Bridges the app's {app, module, action} permissions onto Dealer Audit's
 * role model. See resolveDealerAuditRole for the mapping rules.
 */
export function useCurrentDealerAuditRole(): CurrentDealerAuditRole {
	const { user, isLoading, isSuperAdmin, can, canManageApp } = useAuth();

	const userRole = user?.role;
	const designation = user?.designation;
	const userId = user?.id ?? null;

	const role = useMemo(
		() =>
			resolveDealerAuditRole({
				userRole,
				designation,
				isSuperAdmin,
				canManageApp: canManageApp(DEALER_AUDIT_APP_KEY),
				canWrite: can("write", DEALER_AUDIT_APP_KEY, DEALER_AUDIT_MODULE_KEY),
				canRead: can("read", DEALER_AUDIT_APP_KEY, DEALER_AUDIT_MODULE_KEY),
			}),
		[userRole, designation, isSuperAdmin, can, canManageApp],
	);

	return { role, isLoading, userId, dealerId: null };
}
