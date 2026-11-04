// handouts/useHandoutPermissions.ts
// Page-level gates (which tabs / buttons exist at all). Requester, approver
// and delivery team are separate people, so each should only get their own
// queue:
//   HANDOUT_REQUEST write → "My requests" + "New handout request"
//   HANDOUT_APPROVE write → "To approve"
//   HANDOUT_DELIVER write → "Pending to deliver"
//
// TEMPORARY: ALL PERMISSIONS ARE OFF. Everyone sees the Handouts button and
// every tab. Per-request actions (approve, clarify, deliver, can't fulfil) are
// still decided by the `permissions` flags on GET /handouts/:id, so the
// backend remains the real gate.
//
// TO RE-ENABLE: uncomment the block below, delete the `return { … true … }`
// at the bottom. Nothing else needs to change.

// import { useAuth } from "../../../context/Auth/AuthContext";
// import { usePermission } from "../../../hooks/usePermission";
// import { HANDOUT_APP, HANDOUT_MODULES } from "./handouts.constants";

export function useHandoutPermissions() {
	// const { canReadApp } = useAuth();
	// const hasMapAccess = canReadApp(HANDOUT_APP);
	//
	// const request = usePermission(HANDOUT_APP, HANDOUT_MODULES.request);
	// const approve = usePermission(HANDOUT_APP, HANDOUT_MODULES.approve);
	// const deliver = usePermission(HANDOUT_APP, HANDOUT_MODULES.deliver);
	//
	// return {
	// 	/** Sees the Handouts button and page at all. */
	// 	canOpenHandouts:
	// 		hasMapAccess && (request.canRead || approve.canRead || deliver.canRead),
	// 	/** "My requests" tab + "New handout request" button + the new page. */
	// 	canRequest: request.canWrite,
	// 	/** "To approve" tab. */
	// 	canApprove: approve.canWrite,
	// 	/** "Pending to deliver" tab. */
	// 	canDeliver: deliver.canWrite,
	// };

	return {
		/** Sees the Handouts button and page at all. */
		canOpenHandouts: true,
		/** "My requests" tab + "New handout request" button + the new page. */
		canRequest: true,
		/** "To approve" tab. */
		canApprove: true,
		/** "Pending to deliver" tab. */
		canDeliver: true,
	};
}
