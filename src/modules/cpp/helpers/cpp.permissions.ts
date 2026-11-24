// utils/cpp.permissions.ts — who may do what on one CPP request.
// Pure rules, no React. hooks/useCppPermissions.ts wraps them for components.
//
// Rule (agreed 2026-11-20): only the proposer, the user who created the request,
// can add or change data and files, and only while the request is a draft or has
// been sent back for clarification. Everyone else who can open the request sees
// every field, non-editable. The backend applies the same owner check
// (cpp.controller.ts, loadOwnedRequest); this file keeps the screens in step with it.
import { CPP_STATUS } from "../utils/cpp.constants";

/** Sent back for clarification: the proposer edits and resubmits. */
export const CPP_CLARIFICATION_STATUS = "CLARIFICATION_REQUESTED";

/** Statuses in which the proposer may change data. Same list as the server. */
export const CPP_EDITABLE_STATUSES: readonly string[] = [
	CPP_STATUS.DRAFT,
	CPP_CLARIFICATION_STATUS,
];

/** Anything that carries the owner: a detail record or a listing row. */
export type CppOwnerRecord = {
	initiatedById?: string | null;
	initiatedBy?: { id?: string | null } | null;
};

export type CppPermissionInput = {
	ownerId?: string | null;
	status?: string | null;
	currentUserId?: string | null;
};

export type CppPermissions = {
	/** The signed-in user created this request. */
	isProposer: boolean;
	/** The proposer may add or change data and files now. */
	canEdit: boolean;
	/** Everything is non-editable (the inverse of canEdit). */
	isReadOnly: boolean;
};

/** Owner id from a detail or listing record; the API sends one of the two shapes. */
export const getCppOwnerId = (
	record?: CppOwnerRecord | null,
): string | undefined =>
	record?.initiatedById ?? record?.initiatedBy?.id ?? undefined;

export const getCppPermissions = ({
	ownerId,
	status,
	currentUserId,
}: CppPermissionInput): CppPermissions => {
	const isProposer = Boolean(
		ownerId && currentUserId && ownerId === currentUserId,
	);
	const canEdit =
		isProposer && CPP_EDITABLE_STATUSES.includes(String(status ?? ""));
	return { isProposer, canEdit, isReadOnly: !canEdit };
};
