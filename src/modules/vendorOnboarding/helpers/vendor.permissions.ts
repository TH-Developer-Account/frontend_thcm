// ─────────────────────────────────────────────────────────────────────────
// Vendor onboarding — permission rules (pure, React-free)
// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for "who can do what" across the vendor module.
// Everything here is a plain function of (record | row | stages, user), so
// it can be reused by hooks, column factories and unit tests alike.
//
// Hooks in ../hooks/useVendorPermissions.ts are thin memoized wrappers that
// pull the user from useAuth() and call these.
//
// NOTE: these rules only decide what the UI SHOWS. The backend must still
// enforce every one of them — never rely on a hidden button for security.

import type { useAuth } from "../../../context/Auth/useAuth";
import {
	getWorkflowApproverData,
	type ApprovalStageLike,
} from "../../workflows/utils/approvalWorkflow.helpers";
import type { useVendorOnboardingDetailQuery } from "../queries/useVendorMutations";
import type {
	VendorOnboardingListingRow,
	VendorRowPermissions,
} from "../types/vendorListing.types";
import { getCreatedById } from "./vendor.onboarding.mapper";
import { EDITABLE_STATUSES } from "./vendor.onboarding.validations";

type AuthUser = ReturnType<typeof useAuth>["user"];

type VendorDetail = ReturnType<typeof useVendorOnboardingDetailQuery>["data"];

// ─────────────────────────────────────────────────────────────────────────
// Status rules
// ─────────────────────────────────────────────────────────────────────────

const normalizeStatus = (status: string | null | undefined): string =>
	status
		?.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_") ?? "";

export const isEditableVendorStatus = (
	status: string | null | undefined,
): boolean =>
	(EDITABLE_STATUSES as readonly string[]).includes(normalizeStatus(status));

// Vendor hasn't filled the public form yet — the only state in which the
// invitation email can be re-sent, and the only state with nothing to view.
export const isAwaitingVendorStatus = (
	status: string | null | undefined,
): boolean => normalizeStatus(status) === "AWAITING_VENDOR";

// ─────────────────────────────────────────────────────────────────────────
// Workflow helpers
// ─────────────────────────────────────────────────────────────────────────

type ApprovalIdentity = {
	approverId?: string | null;
	approver?: { id?: string | null; email?: string | null } | null;
};

// True when the user appears as an approver on ANY stage of the workflow
// (any iteration, any status) — not just the current one. Used to keep
// proposer-only actions (e.g. Send Back to Vendor) away from anyone who
// also sits in the approval chain.
export const isUserApproverInAnyStage = (
	stages: readonly ApprovalStageLike[],
	user: { id?: string | null; email?: string | null } | null | undefined,
): boolean => {
	if (!user) return false;

	const userId = user.id ?? "";
	const userEmail = user.email?.trim().toLowerCase() ?? "";

	return stages.some((stage) =>
		(stage.approvals ?? []).some((approval) => {
			const identity = approval as unknown as ApprovalIdentity;

			if (
				userId &&
				(identity.approverId === userId || identity.approver?.id === userId)
			) {
				return true;
			}

			return Boolean(
				userEmail &&
				identity.approver?.email?.trim().toLowerCase() === userEmail,
			);
		}),
	);
};

type ActiveWorkflow = NonNullable<VendorDetail>["activeWorkflow"];

// A clarification round is open: workflow is past its first iteration and
// the current iteration still has a PENDING approval.
export const getHasPendingClarifiedApproval = (
	activeWorkflow: ActiveWorkflow | null | undefined,
): boolean => {
	if (!activeWorkflow || activeWorkflow.iteration <= 1) return false;

	const stages: ApprovalStageLike[] = activeWorkflow.stages ?? [];

	return stages.some(
		(stage) =>
			stage.isCurrentIteration === true &&
			Boolean(
				stage.approvals?.some(
					(approval) => approval.status?.toUpperCase() === "PENDING",
				),
			),
	);
};

// ─────────────────────────────────────────────────────────────────────────
// Record (detail page) permissions
// ─────────────────────────────────────────────────────────────────────────

export type VendorRecordPermissionInput = {
	detail: VendorDetail;
	user: AuthUser;
	isPublicForm: boolean;
};

export const getVendorRecordPermissions = ({
	detail,
	user,
	isPublicForm,
}: VendorRecordPermissionInput) => {
	const status = detail?.status;
	const activeWorkflow = detail?.activeWorkflow ?? null;
	const stages: ApprovalStageLike[] = activeWorkflow?.stages ?? [];
	const userId = user?.id ?? "";

	// ── Who is this user relative to the record? ─────────────────────────
	const isPublicVendor = isPublicForm;
	const isThcmEmployee = !isPublicForm;

	const initiatorId = getCreatedById(detail?.initiatedById);
	const creatorId = detail?.createdBy?.id ?? "";

	const isThcmProposer =
		isThcmEmployee && Boolean(userId) && initiatorId === userId;

	const isRecordCreator =
		isThcmProposer ||
		(isThcmEmployee && Boolean(userId) && creatorId === userId);

	const workflowApproverData = getWorkflowApproverData(activeWorkflow, user);
	const { canActNow, isCurrentStageApprover } = workflowApproverData;

	const isApprover = Boolean(isCurrentStageApprover);
	const isExternalApprover = Boolean(workflowApproverData.isExternalApprover);
	const isTcsApprover = isApprover && isExternalApprover;
	const isApproverOnAnyStage = isUserApproverInAnyStage(stages, user);

	const hasPendingClarifiedApproval =
		getHasPendingClarifiedApproval(activeWorkflow);

	// ── What can they do? ────────────────────────────────────────────────
	const canEditMainForm = isThcmProposer && isEditableVendorStatus(status);

	const canApprove = Boolean(canActNow) && isApprover;

	return {
		// identity / role
		isPublicVendor,
		isThcmEmployee,
		isThcmProposer,
		isRecordCreator,
		isApprover,
		isExternalApprover,
		isTcsApprover,
		isApproverOnAnyStage,

		// workflow state the rules depend on
		workflowApproverData,
		hasPendingClarifiedApproval,

		// form editing
		canEditMainForm,
		canEditFormOne: canEditMainForm,
		canEditFormTwo: canEditMainForm,
		canEditVendorCode: isThcmEmployee && isExternalApprover,
		// Proposer may edit stages/approvers only when resubmitting after a
		// clarification — never on first submit, never as an approver.
		canEditStagesOnResubmit: isThcmProposer && hasPendingClarifiedApproval,

		// submission
		canSubmit: canEditMainForm,
		canSubmitVendorForm: isPublicVendor,
		canSaveDraft: isPublicVendor,

		// workflow actions
		canApprove,
		canClarify: canApprove,
		// Proposer/creator only. Anyone on any approval stage never gets it,
		// even if they also created the record.
		canSendBackToVendor:
			isThcmEmployee &&
			status === "IN_REVIEW" &&
			isRecordCreator &&
			!isApproverOnAnyStage,
		canAcceptAndClose: status === "APPROVED" && isExternalApprover,
	};
};

export type VendorRecordPermissions = ReturnType<
	typeof getVendorRecordPermissions
>;

// ─────────────────────────────────────────────────────────────────────────
// Stage-level permissions (Summary / Review step)
// ─────────────────────────────────────────────────────────────────────────
// Evaluated against the stages being SHOWN (which on steps 3/4 can be a
// preview of a newly picked workflow), not necessarily the server's
// activeWorkflow — hence separate from getVendorRecordPermissions.

export const getVendorStageActionPermissions = (
	stages: ApprovalStageLike[],
	user: AuthUser,
) => {
	const workflowApproverData = getWorkflowApproverData(
		{ isActive: true, status: "IN_PROGRESS", stages },
		user,
	);

	const {
		currentStage,
		canActNow,
		isCurrentStageApprover,
		isExternalApprover,
	} = workflowApproverData;

	const isFinalStage = Boolean(
		currentStage &&
		stages.length > 0 &&
		stages[stages.length - 1]?.id === currentStage.id,
	);

	return {
		workflowApproverData,
		currentStage,
		isFinalStage,
		canActOnCurrentStage: Boolean(canActNow) && Boolean(isCurrentStageApprover),
		// Final-stage external (TCS) approver must have a vendor code on file
		// before Approve goes through.
		requiresVendorCodeToApprove: isFinalStage && Boolean(isExternalApprover),
	};
};

export type VendorStageActionPermissions = ReturnType<
	typeof getVendorStageActionPermissions
>;

// ─────────────────────────────────────────────────────────────────────────
// Listing row permissions
// ─────────────────────────────────────────────────────────────────────────
// The list endpoint doesn't return workflow stages, so row rules can only
// use status + ownership. Ownership needs `initiatedBy.id` from the API;
// until the backend sends it the owner check is skipped (current
// behaviour), and the detail page still redirects non-owners to view.

export const getVendorRowPermissions = (
	row: VendorOnboardingListingRow,
	user: AuthUser,
): VendorRowPermissions => {
	const initiatorId = row.initiatedBy?.id;
	const userId = user?.id;

	// Unknown owner → don't hide (see note above).
	const isOwner = initiatorId
		? Boolean(userId) && initiatorId === userId
		: true;

	const isAwaitingVendor = isAwaitingVendorStatus(row.status);

	return {
		canView: !isAwaitingVendor,
		canEdit: isOwner && isEditableVendorStatus(row.status),
		canRetrigger: isOwner && isAwaitingVendor,
	};
};

// Initiation form: Retrigger Email is only offered while the vendor still
// hasn't submitted.
export const canRetriggerVendorEmail = (
	status: string | null | undefined,
): boolean => isAwaitingVendorStatus(status);
