// permission.utils.ts
// -----------------------------------------------------
// Pure utility helpers for permission calculations.
// No React here. Just logic.
// -----------------------------------------------------

import type { Permission, PermissionFlag } from "./types/profile.types";

/** Default permission flags */
export const getEmptyPermFlags = () => ({
  read: false,
  write: false,
});

/** Check if ALL modules have read + write */
export const areAllEnabled = (modules: Record<string, PermissionFlag>) =>
  Object.values(modules).every((p) => p.read && p.write);

/** Check if ANY module has read OR write */
export const areSomeEnabled = (modules: Record<string, PermissionFlag>) =>
  Object.values(modules).some((p) => p.read || p.write);

/** Check if ALL modules have specific action */
export const areAllActionEnabled = (
  modules: Record<string, PermissionFlag>,
  action: Permission,
) => Object.values(modules).every((p) => p[action]);

/** Check if ANY module has specific action */
export const areSomeActionEnabled = (
  modules: Record<string, PermissionFlag>,
  action: Permission,
) => Object.values(modules).some((p) => p[action]);
