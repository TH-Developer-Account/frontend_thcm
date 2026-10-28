import { useCallback, useMemo } from "react";

import { useAuth } from "../../../context/Auth/useAuth";
import type { WorkflowCreationScope, WorkflowOwnerType } from "../types/types";
import { isVendorOnboardingApp } from "../utils/workflow.constants";

type WorkflowPermissionTarget = {
	ownerType?: WorkflowOwnerType;
	appId?: string;
};

/**
 * Single place for "who can do what" in the workflow module.
 *
 *  - "Workflow admin"  = super admin, or admin of at least one app.
 *  - Shared (ADMIN) templates are created / edited by the admin of that app.
 *  - Personal (USER) templates exist for Vendor Onboarding only.
 *
 * The backend stays the real authority (resolveOwnerType /
 * assertCanMutateTemplate); this only decides what the UI offers.
 */
export const useWorkflowPermissions = () => {
	const { accessibleApps, canManageApp, isSuperAdmin } = useAuth();

	const findApp = useCallback(
		(appId?: string | null) =>
			appId ? accessibleApps.find((app) => app.appId === appId) : undefined,
		[accessibleApps],
	);

	const canManageAppById = useCallback(
		(appId?: string | null): boolean => {
			if (!appId) return false;
			if (isSuperAdmin) return true;

			const appKey = findApp(appId)?.appKey;

			return Boolean(appKey && canManageApp(appKey));
		},
		[canManageApp, findApp, isSuperAdmin],
	);

	const isVendorOnboardingAppId = useCallback(
		(appId?: string | null): boolean => isVendorOnboardingApp(findApp(appId)),
		[findApp],
	);

	const isWorkflowAdmin = useMemo(
		() =>
			Boolean(isSuperAdmin) ||
			accessibleApps.some(
				(app) => Boolean(app.appKey) && canManageApp(app.appKey),
			),
		[accessibleApps, canManageApp, isSuperAdmin],
	);

	/**
	 * Apps offered in the "App" dropdown when CREATING a workflow:
	 * apps the user administers (shared templates) plus Vendor Onboarding
	 * (personal templates). Everyone else only gets Vendor Onboarding.
	 */
	const creatableApps = useMemo(
		() =>
			accessibleApps.filter(
				(app) => canManageAppById(app.appId) || isVendorOnboardingApp(app),
			),
		[accessibleApps, canManageAppById],
	);

	/**
	 * What the template-type choice looks like for a given app:
	 *  - admin of a Vendor Onboarding app → can choose Shared or Personal
	 *  - admin of any other app           → Shared only (no choice)
	 *  - not an admin (Vendor Onboarding) → Personal only (no choice)
	 */
	const getScopeForApp = useCallback(
		(
			appId?: string | null,
		): { scope: WorkflowCreationScope; canChoose: boolean } => {
			const admin = canManageAppById(appId);
			const vendor = isVendorOnboardingAppId(appId);

			return {
				scope: admin && !vendor ? "APP" : "USER",
				canChoose: admin && vendor,
			};
		},
		[canManageAppById, isVendorOnboardingAppId],
	);

	/**
	 * Edit button rule. Personal templates are editable (the list only shows a
	 * user their own, super admins see all). Shared/admin templates are
	 * editable by the admin of that template's app. Anything unknown fails
	 * closed to view-only.
	 */
	const canEditWorkflow = useCallback(
		(workflow: WorkflowPermissionTarget): boolean => {
			if (workflow.ownerType === "USER") return true;
			if (workflow.ownerType === "ADMIN") {
				return canManageAppById(workflow.appId);
			}

			return false;
		},
		[canManageAppById],
	);

	return {
		isWorkflowAdmin,
		creatableApps,
		canManageAppById,
		isVendorOnboardingAppId,
		getScopeForApp,
		canEditWorkflow,
	};
};
