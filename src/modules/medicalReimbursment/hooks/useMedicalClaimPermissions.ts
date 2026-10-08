import { useMemo } from "react";

import type {
	ReimbursementClaimActor,
	ReimbursementClaimFormMode,
} from "../types/reimbursementClaim.types";
import {
	GUEST_EDITABLE_STATUSES,
	PUBLIC_EDITABLE_STATUSES,
	normalizeStatus,
} from "../utils/medicalClaimStatus.constants";
import { MEDICLAIM_BACKEND } from "../utils/mediclaimBackend.config";

/*
 * ----------------------------------------------------------------------------
 * Medical claim permissions — single source of truth for "who can do what".
 * ----------------------------------------------------------------------------
 *
 * Three ways into a claim:
 *   - "public"   → retired employee via the token link (/medical-claim-form/:token)
 *   - "guest"    → retired employee logged into the guest portal
 *   - "internal" → THCM user (initiator / workflow approver)
 *
 * "public" and "guest" are both the claimant. A claimant can NEVER review
 * line items (approved amount / approve / remarks), whatever the workflow
 * data says. The backend enforces every one of these rules again.
 */

export type MedicalClaimAccessContext = "public" | "guest" | "internal";

export { GUEST_EDITABLE_STATUSES, PUBLIC_EDITABLE_STATUSES };

/** The subset of getWorkflowApproverData()'s result this hook needs. */
export type MedicalClaimWorkflowAccess = {
	isCurrentStageApprover?: boolean;
	isExternalApprover?: boolean;
	wasExternalApprover?: boolean;
	canActNow?: boolean;
};

export type ResolveMedicalClaimPermissionsArgs = {
	context: MedicalClaimAccessContext;
	/** Claim status from the API (case-insensitive). */
	status?: string | null;
	/** Internal only — workflow approver data for the logged-in user. */
	workflow?: MedicalClaimWorkflowAccess | null;
	/** Internal only — true when the logged-in user initiated the claim. */
	isInitiator?: boolean;
	/** Guest only — true when the guest is starting a brand-new claim. */
	isCreate?: boolean;
};

export type MedicalClaimPermissions = {
	context: MedicalClaimAccessContext;
	normalizedStatus: string;

	// Who is looking
	isClaimant: boolean;
	isInternalUser: boolean;
	isInitiator: boolean;
	isCurrentApprover: boolean;
	isExternalApprover: boolean;
	actorRole: ReimbursementClaimActor;

	// Claim form (header + bill rows)
	mode: ReimbursementClaimFormMode;
	canEditClaim: boolean;
	canSaveDraft: boolean;
	canSubmit: boolean;

	// Line-item review (Approved Amount / Approved / Remarks columns)
	canReviewLineItems: boolean;
	/** Hide the review columns entirely (claimant filling a fresh claim). */
	hideReviewColumns: boolean;

	// Workflow
	canApprove: boolean;
	canClarify: boolean;
	canComment: boolean;
	canViewWorkflow: boolean;
	canViewAudit: boolean;

	// Claim-level actions
	canExport: boolean;
	canDownloadPdf: boolean;
	canResendLink: boolean;
	canClose: boolean;
};

/** Pure resolver — unit-testable without React. */
export function resolveMedicalClaimPermissions({
	context,
	status,
	workflow,
	isInitiator = false,
	isCreate = false,
}: ResolveMedicalClaimPermissionsArgs): MedicalClaimPermissions {
	const normalizedStatus = normalizeStatus(status);

	const isClaimant = context !== "internal";
	const isInternalUser = !isClaimant;
	const isInternalInitiator = isInternalUser && isInitiator;

	const isExternalApprover =
		isInternalUser &&
		Boolean(workflow?.isExternalApprover || workflow?.wasExternalApprover);
	const isCurrentApprover =
		isInternalUser && Boolean(workflow?.isCurrentStageApprover);

	// Approving only makes sense while the claim is in the workflow. An
	// unknown status (field missing) defers to the workflow data.
	const isInWorkflow = !normalizedStatus || normalizedStatus === "IN_PROGRESS";
	const canActNow =
		isCurrentApprover && Boolean(workflow?.canActNow) && isInWorkflow;

	let canEditClaim = false;
	if (context === "public") {
		// Unknown status is treated as editable — the backend still rejects a used token.
		canEditClaim =
			!normalizedStatus || PUBLIC_EDITABLE_STATUSES.has(normalizedStatus);
	} else if (context === "guest") {
		canEditClaim = isCreate || GUEST_EDITABLE_STATUSES.has(normalizedStatus);
	}

	const actorRole: ReimbursementClaimActor = isClaimant
		? "creator"
		: isExternalApprover && isCurrentApprover
			? "externalApprover"
			: isCurrentApprover
				? "approver"
				: "creator";

	const isApproved = normalizedStatus === "APPROVED";

	return {
		context,
		normalizedStatus,

		isClaimant,
		isInternalUser,
		isInitiator: isInternalInitiator,
		isCurrentApprover,
		isExternalApprover,
		actorRole,

		mode: canEditClaim ? "edit" : "view",
		canEditClaim,
		canSaveDraft: context === "public" && canEditClaim,
		canSubmit: canEditClaim,

		// Claimant never reviews line items; external approvers only "OK".
		canReviewLineItems: isInternalUser && canActNow && !isExternalApprover,
		// A claimant filling a fresh claim has nothing to see in these columns.
		// During clarification (guest) they are shown read-only so the
		// claimant can read the approver's remarks.
		hideReviewColumns:
			context === "public" || (context === "guest" && isCreate),

		canApprove: canActNow,
		canClarify: canActNow && !isExternalApprover,
		canComment: isCurrentApprover,
		canViewWorkflow: isInternalUser,
		canViewAudit: isInternalUser,

		canExport: isInternalUser,
		canDownloadPdf: isInternalUser,
		canResendLink:
			isInternalInitiator && normalizedStatus === "AWAITING_EX_EMPLOYEE",
		// The current backend lets only the initiator close an APPROVED claim.
		canClose:
			isApproved &&
			(isInternalInitiator ||
				(MEDICLAIM_BACKEND.externalApproverClose && isExternalApprover)),
	};
}

export function useMedicalClaimPermissions({
	context,
	status,
	workflow,
	isInitiator,
	isCreate,
}: ResolveMedicalClaimPermissionsArgs): MedicalClaimPermissions {
	return useMemo(
		() =>
			resolveMedicalClaimPermissions({
				context,
				status,
				workflow,
				isInitiator,
				isCreate,
			}),
		[context, status, workflow, isInitiator, isCreate],
	);
}

export default useMedicalClaimPermissions;
