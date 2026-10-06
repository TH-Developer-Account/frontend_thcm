import type {
  ModuleDefinition,
  ModulePermissionState,
  Permission,
  PermissionFlag,
  ProfilePermission,
  ProfilePermissionInput,
} from "../types/profile.types";

const PERMISSION_ACTIONS: Permission[] = ["read", "write"];

// Write implies read, and removing read removes write: a module a user can
// change but not see is never a valid state.
export const setPermissionFlag = (
  flags: PermissionFlag,
  action: Permission,
  enabled: boolean,
): PermissionFlag =>
  action === "write"
    ? { read: enabled || flags.read, write: enabled }
    : { read: enabled, write: enabled && flags.write };

export const createModulePermissionState = (
  modules: ModuleDefinition[],
  granted: ProfilePermission[] = [],
): ModulePermissionState =>
  Object.fromEntries(
    modules.map((appModule) => {
      const isGranted = (action: Permission) =>
        granted.some(
          (permission) =>
            permission.moduleKey === appModule.key &&
            permission.action === action,
        );
      return [
        appModule.key,
        { read: isGranted("read"), write: isGranted("write") },
      ];
    }),
  );

export const togglePermission = (
  state: ModulePermissionState,
  moduleKey: string,
  action: Permission,
): ModulePermissionState => {
  const current = state[moduleKey];
  if (!current) return state;

  return {
    ...state,
    [moduleKey]: setPermissionFlag(current, action, !current[action]),
  };
};

export const setActionForAllModules = (
  state: ModulePermissionState,
  action: Permission,
  enabled: boolean,
): ModulePermissionState =>
  Object.fromEntries(
    Object.entries(state).map(([moduleKey, flags]) => [
      moduleKey,
      setPermissionFlag(flags, action, enabled),
    ]),
  );

export const setAllPermissions = (
  state: ModulePermissionState,
  enabled: boolean,
): ModulePermissionState =>
  Object.fromEntries(
    Object.keys(state).map((moduleKey) => [
      moduleKey,
      { read: enabled, write: enabled },
    ]),
  );

export const toPermissionInputs = (
  state: ModulePermissionState,
): ProfilePermissionInput[] =>
  Object.entries(state).flatMap(([moduleKey, flags]) =>
    PERMISSION_ACTIONS.filter((action) => flags[action]).map((action) => ({
      moduleKey,
      action,
    })),
  );
