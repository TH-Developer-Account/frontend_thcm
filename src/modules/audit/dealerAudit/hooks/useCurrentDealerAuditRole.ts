import { useMemo } from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { resolveDealerAuditRole } from "../dealer-audit.access";
import type { DealerAuditRole } from "../dealer-audit.types";

// Must match the app/module keys the backend's authorize() checks.
const APP_KEY = "DEALER_AUDIT";
const MODULE_ADMIN = "DEALER_AUDIT_ADMIN";
const MODULE_REVIEW = "DEALER_AUDIT_REVIEW";
const MODULE_DEALER = "DEALER_AUDIT_DEALER";

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
	const { user, isLoading, can, canManageApp } = useAuth();

	const userRole = user?.userType === "DEALER" ? "DEALER" : user?.role;
	const designation = user?.designation;
	const userId = user?.id ?? null;

	const role = useMemo(
		() =>
			resolveDealerAuditRole({
				userRole,
				designation,
				isAppAdmin: canManageApp(APP_KEY),
				canAdminWrite: can("write", APP_KEY, MODULE_ADMIN),
				canAdminRead: can("read", APP_KEY, MODULE_ADMIN),
				canReviewWrite: can("write", APP_KEY, MODULE_REVIEW),
				canDealerRead: can("read", APP_KEY, MODULE_DEALER),
			}),
		[userRole, designation, can, canManageApp],
	);

	return { role, isLoading, userId, dealerId: null };
}
