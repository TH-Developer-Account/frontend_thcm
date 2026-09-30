import * as React from "react";

import { useAuth } from "../../../context/Auth/useAuth";
import type { ApprovalStageLike } from "../../workflows/utils/approvalWorkflow.helpers";
import {
	getVendorRecordPermissions,
	getVendorRowPermissions,
	getVendorStageActionPermissions,
	type VendorRecordPermissionInput,
	type VendorRecordPermissions,
	type VendorStageActionPermissions,
} from "../helpers/vendor.permissions";
import type {
	VendorOnboardingListingRow,
	VendorRowPermissions,
} from "../types/vendorListing.types";

// Thin React wrappers around ../helpers/vendor.permissions.ts — they only
// supply the current user and memoize. All rules live in the helper file.

/** Detail/edit/view pages — what the current user can do on ONE record. */
export function useVendorRecordPermissions({
	detail,
	isPublicForm,
}: Omit<VendorRecordPermissionInput, "user">): VendorRecordPermissions {
	const { user } = useAuth();

	return React.useMemo(
		() => getVendorRecordPermissions({ detail, user, isPublicForm }),
		[detail, user, isPublicForm],
	);
}

/** Summary / review step — can the user act on the stage being shown? */
export function useVendorStageActionPermissions(
	stages: ApprovalStageLike[],
): VendorStageActionPermissions {
	const { user } = useAuth();

	return React.useMemo(
		() => getVendorStageActionPermissions(stages, user),
		[stages, user],
	);
}

/** Listing — a stable per-row resolver to hand to the table columns. */
export function useVendorListingPermissions(): (
	row: VendorOnboardingListingRow,
) => VendorRowPermissions {
	const { user } = useAuth();

	return React.useCallback(
		(row: VendorOnboardingListingRow) => getVendorRowPermissions(row, user),
		[user],
	);
}
