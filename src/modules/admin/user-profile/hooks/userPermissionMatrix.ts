import { useEffect, useState } from "react";

import {
  createModulePermissionState,
  setActionForAllModules,
  setAllPermissions,
  togglePermission,
} from "../utils/permissions";
import {
  areAllActionEnabled,
  areAllEnabled,
  areSomeActionEnabled,
} from "../utils/permission.utils";

import type {
  ModuleDefinition,
  ModulePermissionState,
  Permission,
  ProfilePermission,
} from "../types/profile.types";

export type ActionCheckboxState = { all: boolean; some: boolean };

// Holds the read/write grid for the ONE app a profile belongs to. Callers must
// pass referentially stable arrays, otherwise the reset effect loops.
export const usePermissionMatrix = (
  modules: ModuleDefinition[],
  granted: ProfilePermission[],
) => {
  const [permissionState, setPermissionState] = useState<ModulePermissionState>(
    () => createModulePermissionState(modules, granted),
  );

  // Switching app (create) or loading the profile (edit) replaces the grid.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissionState(createModulePermissionState(modules, granted));
  }, [modules, granted]);

  const toggleModulePermission = (moduleKey: string, action: Permission) =>
    setPermissionState((current) =>
      togglePermission(current, moduleKey, action),
    );

  const toggleAllPermissions = () =>
    setPermissionState((current) =>
      setAllPermissions(current, !areAllEnabled(current)),
    );

  const toggleActionForAllModules = (action: Permission) =>
    setPermissionState((current) =>
      setActionForAllModules(
        current,
        action,
        !areAllActionEnabled(current, action),
      ),
    );

  const getActionCheckboxState = (action: Permission): ActionCheckboxState => {
    const all = areAllActionEnabled(permissionState, action);
    // "some" drives the indeterminate dash, which must not show when all are on.
    return { all, some: !all && areSomeActionEnabled(permissionState, action) };
  };

  return {
    permissionState,
    toggleModulePermission,
    toggleAllPermissions,
    toggleActionForAllModules,
    getActionCheckboxState,
  };
};
