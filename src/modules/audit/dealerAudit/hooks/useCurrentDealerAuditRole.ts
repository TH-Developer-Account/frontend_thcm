import { useMemo } from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import {
	DEALER_AUDIT_APP_KEY,
	DEALER_AUDIT_MODULES,
	resolveDealerAuditRole,
} from "../dealer-audit.access";
import type { DealerAuditRole } from "../dealer-audit.types";

// Re-exported so the sidebar can keep importing the keys from here.
export { DEALER_AUDIT_APP_KEY, DEALER_AUDIT_MODULES };

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

	const userType = user?.userType;
	const designation = user?.designation;
	const userId = user?.id ?? null;

	const role = useMemo(() => {
		const app = DEALER_AUDIT_APP_KEY;
		const { admin, review, dealer } = DEALER_AUDIT_MODULES;
		// A dealer login is always a dealer, whatever else it was granted.
		const internal = userType !== "DEALER";

		return resolveDealerAuditRole({
			designation: internal ? designation : undefined,
			isAppAdmin: internal && (isSuperAdmin || canManageApp(app)),
			canAdminRead: internal && can("read", app, admin),
			canAdminWrite: internal && can("write", app, admin),
			canReview: internal && can("write", app, review),
			isDealer: can("read", app, dealer) || can("write", app, dealer),
		});
	}, [userType, designation, isSuperAdmin, can, canManageApp]);

	return { role, isLoading, userId, dealerId: null };
}
