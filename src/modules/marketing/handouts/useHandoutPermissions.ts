// handouts/useHandoutPermissions.ts
// Page-level gates (which tabs / buttons exist at all).
//
// TEMPORARY: anyone who can open the MAP app gets full access to Handouts
// (button, request, approve queue, delivery queue). Per-request actions
// (approve, reject, cancel, deliver) are still decided by the `permissions`
// flags on GET /handouts/:id, so the backend remains the real gate.
//
// TO RESTRICT LATER: switch `hasMapAccess` for the per-module checks kept in
// the comment block below (HANDOUT_MODULES in handouts.constants.ts) and
// create those modules in the profile editor. Nothing else needs to change.

import { useAuth } from "../../../context/Auth/AuthContext";
import { HANDOUT_APP } from "./handouts.constants";

export function useHandoutPermissions() {
	const { canReadApp } = useAuth();
	const hasMapAccess = canReadApp(HANDOUT_APP);

	/* Later, per module:
	 *   const request = usePermission(HANDOUT_APP, HANDOUT_MODULES.request);
	 *   const approve = usePermission(HANDOUT_APP, HANDOUT_MODULES.approve);
	 *   const deliver = usePermission(HANDOUT_APP, HANDOUT_MODULES.deliver);
	 *   canOpenHandouts: request.canRead || approve.canRead || deliver.canRead,
	 *   canRequest: request.canWrite,
	 *   canApprove: approve.canWrite,
	 *   canDeliver: deliver.canWrite,
	 */

	return {
		/** Sees the Handouts button and page at all. */
		canOpenHandouts: hasMapAccess,
		/** "My requests" tab + "New handout request" button. */
		canRequest: hasMapAccess,
		/** "To approve" tab. */
		canApprove: hasMapAccess,
		/** "To deliver" tab. */
		canDeliver: hasMapAccess,
	};
}
