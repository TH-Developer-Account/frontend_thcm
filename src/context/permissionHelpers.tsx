import { useAuth } from "./Auth/AuthContext";
import type { ReactNode } from "react";
import type { PermissionAction } from "./context.types";

// ─────────────────────────────────────────────────────────────────────────────
// components/Can.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Declarative wrapper — renders children only when permission is granted.
//
// Usage:
//   <Can action="write" app="MAP" module="EPC">
//     <CreateButton />
//   </Can>
//
//   <Can action="write" app="MAP" module="EPC" fallback={<ViewOnlyBadge />}>
//     <EditButton />
//   </Can>

type CanProps = {
  action: PermissionAction;
  app: string;
  module: string;
  children: ReactNode;
  fallback?: ReactNode; // shown when permission is denied (default: nothing)
};

export function Can({
  action,
  app,
  module,
  children,
  fallback = null,
}: CanProps) {
  const { can } = useAuth();
  return <>{can(action, app, module) ? children : fallback}</>;
}
