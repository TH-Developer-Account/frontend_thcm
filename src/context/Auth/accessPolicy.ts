import type {
  AccessSession,
  AppSummary,
  PermissionAction,
} from "./AuthContext";

// Same rules as the backend's kernel/rbac/accessPolicy.ts. The frontend only
// uses them to decide what to show; the API enforces them on every request.

export const EMPTY_ACCESS_SESSION: AccessSession = {
  isSuperAdmin: false,
  administeredApps: [],
  permissions: [],
};

export function isAppAdministrator(
  session: AccessSession,
  appKey: string,
): boolean {
  return (
    session.isSuperAdmin ||
    session.administeredApps.some((app) => app.appKey === appKey)
  );
}

export function canAccessAdministration(session: AccessSession): boolean {
  return session.isSuperAdmin || session.administeredApps.length > 0;
}

export function hasModulePermission(
  session: AccessSession,
  action: PermissionAction,
  appKey: string,
  moduleKey: string,
): boolean {
  return (
    isAppAdministrator(session, appKey) ||
    session.permissions.some(
      (permission) =>
        permission.action === action &&
        permission.appKey === appKey &&
        permission.moduleKey === moduleKey,
    )
  );
}

export function hasAppAction(
  session: AccessSession,
  appKey: string,
  action: PermissionAction,
): boolean {
  return (
    isAppAdministrator(session, appKey) ||
    session.permissions.some(
      (permission) =>
        permission.appKey === appKey && permission.action === action,
    )
  );
}

// An app admin may hold no profile in the app they manage, so their apps
// come from both sources.
export function listAccessibleApps(session: AccessSession): AppSummary[] {
  const appsById = new Map<string, AppSummary>();
  for (const app of [...session.administeredApps, ...session.permissions]) {
    if (!appsById.has(app.appId)) {
      appsById.set(app.appId, {
        appId: app.appId,
        appKey: app.appKey,
        appName: app.appName,
      });
    }
  }
  return [...appsById.values()];
}
