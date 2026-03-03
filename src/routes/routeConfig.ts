// routeConfig.ts — single source of truth for all route permissions
import type { PermissionAction } from "../context/context.types";

export type RoutePermission = {
  action: PermissionAction;
  app: string;
  module: string;
};

export type RouteConfig = {
  path: string;
  permission?: RoutePermission;
};

export const routeConfig: RouteConfig[] = [
  // No permission required (just needs to be logged in)
  { path: "/dashboard" },
  { path: "/profile" },
  { path: "/settings" },

  // MAP app
  { path: "/map", permission: { action: "read", app: "MAP", module: "EPC" } },
  {
    path: "/map/epc",
    permission: { action: "read", app: "MAP", module: "EPC" },
  },
  {
    path: "/map/epc/create",
    permission: { action: "write", app: "MAP", module: "EPC" },
  },
  {
    path: "/map/epc/:id",
    permission: { action: "read", app: "MAP", module: "EPC" },
  },
  {
    path: "/map/epc/:id/edit",
    permission: { action: "write", app: "MAP", module: "EPC" },
  },
  {
    path: "/map/epf",
    permission: { action: "read", app: "MAP", module: "EPF" },
  },
  {
    path: "/map/epf/create",
    permission: { action: "write", app: "MAP", module: "EPF" },
  },
  {
    path: "/map/crf",
    permission: { action: "read", app: "MAP", module: "CRF" },
  },

  // HR app
  {
    path: "/hr/payroll",
    permission: { action: "read", app: "HR", module: "PAYROLL" },
  },
  {
    path: "/hr/payroll/edit",
    permission: { action: "write", app: "HR", module: "PAYROLL" },
  },
  {
    path: "/hr/employees",
    permission: { action: "read", app: "HR", module: "EMP_MGMT" },
  },
  {
    path: "/hr/employees/new",
    permission: { action: "write", app: "HR", module: "EMP_MGMT" },
  },

  // CRM app
  {
    path: "/crm/leads",
    permission: { action: "read", app: "CRM", module: "LEADS" },
  },
  {
    path: "/crm/leads/new",
    permission: { action: "write", app: "CRM", module: "LEADS" },
  },
  {
    path: "/crm/deals",
    permission: { action: "read", app: "CRM", module: "DEALS" },
  },
];

// Matches current pathname against config, handles :param segments
export function matchRoute(pathname: string): RouteConfig | undefined {
  return routeConfig.find((route) => {
    const configSegs = route.path.split("/");
    const currentSegs = pathname.split("/");
    if (configSegs.length !== currentSegs.length) return false;
    return configSegs.every(
      (seg, i) => seg.startsWith(":") || seg === currentSegs[i],
    );
  });
}
