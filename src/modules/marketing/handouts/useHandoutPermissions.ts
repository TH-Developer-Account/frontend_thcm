// handouts/useHandoutPermissions.ts
// Page-level gates (which tabs / buttons exist at all).
//
// TEMPORARY: ALL PERMISSIONS ARE OFF. Everyone sees the Handouts button and
// every tab (My requests, To approve, To deliver). Per-request actions
// (approve, reject, cancel, deliver) are still decided by the `permissions`
// flags on GET /handouts/:id, so the backend remains the real gate.
//
// TO RE-ADD LATER: restore the useAuth / usePermission block below and return
// those values instead of `true`. Nothing else needs to change.

export function useHandoutPermissions() {
	/* Re-add later, MAP app access:
	 *   import { useAuth } from "../../../context/Auth/AuthContext";
	 *   import { HANDOUT_APP } from "./handouts.constants";
	 *   const { canReadApp } = useAuth();
	 *   const hasMapAccess = canReadApp(HANDOUT_APP);
	 *
	 * Re-add later, per module (HANDOUT_MODULES in handouts.constants.ts):
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
		canOpenHandouts: true,
		/** "My requests" tab + "New handout request" button. */
		canRequest: true,
		/** "To approve" tab. */
		canApprove: true,
		/** "To deliver" tab. */
		canDeliver: true,
	};
}
