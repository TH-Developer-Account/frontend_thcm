import { useMemo } from "react";

import type {
	ReimbursementClaimActor,
	ReimbursementClaimFormMode,
} from "../types/reimbursementClaim.types";

/*
 * ----------------------------------------------------------------------------
 * Medical claim permissions — single source of truth for "who can do what".
 * ----------------------------------------------------------------------------
 *
 * Three ways into a claim:
 *   - "public"   → retired employee via the token link (/medi-claim/public/:token)
 *   - "guest"    → retired employee logged into the guest portal
 *   - "internal" → THCM user (initiator / workflow approver)
 *
 * "public" and "guest" are both the claimant (the retired employee). A
 * claimant can NEVER review line items (approved amount / approve / remarks),
 * whatever the workflow data says.
 */

export type MedicalClaimAccessContext = "public" | "guest" | "internal";

/** Token form is editable until the claim is submitted. */
export const PUBLIC_EDITABLE_STATUSES = new Set([
	"AWAITING_EX_EMPLOYEE",
	"DRAFT",
]);

/** Guest portal can only edit after an approver sends it back. */
export const GUEST_EDITABLE_STATUSES = new Set([
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
]);

/**
 * The subset of getWorkflowApproverData()'s result this hook needs. Kept
 * structural so the hook doesn't depend on the workflows module's types.
 */
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

	// Workflow
	canApprove: boolean;
	canClarify: boolean;
	canComment: boolean;
	canViewWorkflow: boolean;
	canViewAudit: boolean;

	// Claim-level actions
	canExport: boolean;
	canResendLink: boolean;
	canClose: boolean;
};

/** Pure resolver — unit-testable without React. */
export function resolveMedicalClaimPermissions({
	context,
	status,
	workflow,
	isInitiator = false,
}: ResolveMedicalClaimPermissionsArgs): MedicalClaimPermissions {
	const normalizedStatus = status?.trim().toUpperCase() ?? "";

	const isClaimant = context !== "internal";
	const isInternalUser = !isClaimant;
	const isInternalInitiator = isInternalUser && isInitiator;

	const isExternalApprover =
		isInternalUser &&
		Boolean(workflow?.isExternalApprover || workflow?.wasExternalApprover);
	const isCurrentApprover =
		isInternalUser &&
		!isExternalApprover &&
		Boolean(workflow?.isCurrentStageApprover);
	const canActNow = isCurrentApprover && Boolean(workflow?.canActNow);

	// Public token form: an unknown status (field missing from the response)
	// is treated as editable — the backend still rejects a used token.
	const canEditClaim =
		context === "public"
			? !normalizedStatus || PUBLIC_EDITABLE_STATUSES.has(normalizedStatus)
			: context === "guest"
				? GUEST_EDITABLE_STATUSES.has(normalizedStatus)
				: false;

	const actorRole: ReimbursementClaimActor = isClaimant
		? "creator"
		: isExternalApprover
			? "externalApprover"
			: isCurrentApprover
				? "approver"
				: "creator";

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

		// Claimant never reviews line items.
		canReviewLineItems: isInternalUser && canActNow,

		canApprove: canActNow,
		canClarify: canActNow,
		canComment: isCurrentApprover,
		canViewWorkflow: isInternalUser,
		canViewAudit: isInternalUser,

		canExport: isInternalUser,
		canResendLink:
			isInternalInitiator && normalizedStatus === "AWAITING_EX_EMPLOYEE",
		canClose: isInternalInitiator && normalizedStatus === "APPROVED",
	};
}

export function useMedicalClaimPermissions({
	context,
	status,
	workflow,
	isInitiator,
}: ResolveMedicalClaimPermissionsArgs): MedicalClaimPermissions {
	return useMemo(
		() =>
			resolveMedicalClaimPermissions({
				context,
				status,
				workflow,
				isInitiator,
			}),
		[context, status, workflow, isInitiator],
	);
}

export default useMedicalClaimPermissions;
