import React from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";

import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";
import Button from "../../../../components/common/Button";
import SelectInput from "../../../../components/forms/SelectInput";
import Card from "../../../../components/common/Card";

import type { WorkspacePayload } from "../types/profile.types";
import type { SingleValue } from "react-select";

type Permission = {
  read: boolean;
  write: boolean;
};

type PermState = Record<string, Record<string, Permission>>;

interface Module {
  key: string;
  name: string;
}

interface AppItem {
  key: string;
  name: string;
  modules: Module[];
}

type Action = "read" | "write";

type Option = {
  label: string;
  value: string;
};

interface Props {
  filteredApps: AppItem[];
  collapsed: Record<string, boolean>;
  permState: PermState;

  search: string;
  setSearch: (v: string) => void;
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  appActionState: (
    app: string,
    action: Action,
  ) => { all: boolean; some: boolean };

  toggleAppAll: (app: string) => void;
  toggleAppAction: (app: string, action: Action) => void;
  togglePerm: (app: string, mod: string, action: Action) => void;

  // ✅ NEW — apps the profile being edited already administers, derived
  // from any scope: "APP" rows in form.permissions. Empty array on create.
  initialAdminAppKeys?: string[];

  onSavePermissions: (data: WorkspacePayload) => void;
  isLoading: boolean;
  goBack: () => void;
}

const ACTIONS: Action[] = ["read", "write"];

const PROFILE_TYPE_OPTIONS: Option[] = [
  { label: "Admin", value: "ADMIN" },
  { label: "User", value: "USER" },
];

const joinClassNames = (
  ...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

export default function PermissionMatrix({
  filteredApps,
  collapsed,
  permState,
  search,
  isLoading,
  setSearch,
  setCollapsed,
  appActionState,
  toggleAppAll,
  toggleAppAction,
  togglePerm,
  initialAdminAppKeys = [],
  onSavePermissions,
  goBack,
}: Props) {
  // ── Per-app profile type — ✅ FIXED from a single shared value ────────────
  // Each app independently gets its own ADMIN/USER selection. Seeded from
  // initialAdminAppKeys so editing a profile that already administers MAP
  // shows "Admin" pre-selected for MAP without touching other apps.
  const [profileTypeByApp, setProfileTypeByApp] = React.useState<
    Record<string, "ADMIN" | "USER">
  >(() =>
    Object.fromEntries(
      initialAdminAppKeys.map((appKey) => [appKey, "ADMIN" as const]),
    ),
  );

  const getProfileType = (appKey: string): "ADMIN" | "USER" =>
    profileTypeByApp[appKey] ?? "USER";

  const collectPermissions = () => {
    const permissions: WorkspacePayload = [];

    Object.entries(permState).forEach(([appKey, modules]) => {
      Object.entries(modules).forEach(([moduleKey, perms]) => {
        if (perms.read) {
          permissions.push({
            scope: "MODULE",
            action: "read",
            appKey,
            moduleKey,
          });
        }

        if (perms.write) {
          permissions.push({
            scope: "MODULE",
            action: "write",
            appKey,
            moduleKey,
          });
        }
      });
    });

    // One entry per app marked "Admin", with scope: "APP" and NO moduleKey.
    filteredApps.forEach((app) => {
      if (getProfileType(app.key) === "ADMIN") {
        permissions.push({
          scope: "APP",
          action: "write",
          appKey: app.key,
        });
      }
    });

    onSavePermissions(permissions);
  };

  const handleProfileTypeChange = (
    appKey: string,
    option: SingleValue<Option>,
  ) => {
    if (!option) return;

    setProfileTypeByApp((prev) => ({
      ...prev,
      [appKey]: option.value as "ADMIN" | "USER",
    }));
  };

  return (
    <Card
      title="Permissions Matrix"
      actions={
        <div className="w-full min-w-0 sm:w-72">
          <SearchInput
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder="Search modules..."
          />
        </div>
      }
    >
      <div className="permission-matrix">
        {/* DESKTOP / TABLET MATRIX */}
        <div className="permission-matrix-table-shell scrollbar-sleek">
          <div className="permission-matrix-table">
            <div className="permission-matrix-header">
              <div className="permission-matrix-header-cell permission-matrix-header-main">
                App / Module
              </div>

              <div className="permission-matrix-header-cell permission-matrix-action-cell">
                Read
              </div>

              <div className="permission-matrix-header-cell permission-matrix-action-cell">
                Write
              </div>
            </div>

            <div className="permission-matrix-body">
              {filteredApps.map((app) => {
                const isCollapsed = collapsed[app.key];

                return (
                  <section
                    key={app.key}
                    className="permission-matrix-group"
                    aria-labelledby={`permission-app-${app.key}`}
                  >
                    {/* APP ROW */}
                    <div className="permission-matrix-app-row">
                      <div className="permission-matrix-app-main-cell">
                        <button
                          type="button"
                          className="permission-matrix-app-trigger"
                          onClick={() =>
                            setCollapsed((current) => ({
                              ...current,
                              [app.key]: !current[app.key],
                            }))
                          }
                          aria-expanded={!isCollapsed}
                          aria-controls={`permission-modules-${app.key}`}
                        >
                          <ChevronDown
                            size={16}
                            aria-hidden="true"
                            className={joinClassNames(
                              "permission-matrix-chevron",
                              isCollapsed &&
                                "permission-matrix-chevron-collapsed",
                            )}
                          />

                          <span className="permission-matrix-app-avatar">
                            {app.key.slice(0, 2).toUpperCase()}
                          </span>

                          <span className="permission-matrix-app-copy">
                            <span
                              id={`permission-app-${app.key}`}
                              className="permission-matrix-app-name"
                            >
                              {app.name}
                            </span>

                            <span className="permission-matrix-app-meta">
                              {app.key} · {app.modules.length} modules
                            </span>
                          </span>
                        </button>

                        <div>
                          <SelectInput
                            name="pageSize"
                            options={PROFILE_TYPE_OPTIONS}
                            value={PROFILE_TYPE_OPTIONS.find(
                              (o) => o.value === getProfileType(app.key),
                            )}
                            onChange={(option) =>
                              handleProfileTypeChange(app.key, option)
                            }
                            isSearchable={false}
                            aria-label={`${app.name} profile type`}
                            className="pagination-page-size-select"
                          />

                          <Button
                            type="button"
                            text="Select All"
                            appearance="ghost"
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleAppAll(app.key)}
                          />
                        </div>
                      </div>

                      {(["read", "write"] as Action[]).map((action) => {
                        const state = appActionState(app.key, action);

                        return (
                          <div
                            key={action}
                            className="permission-matrix-action-cell permission-matrix-app-action"
                          >
                            <Checkbox
                              checked={state.all}
                              indeterminate={state.some}
                              onChange={() => toggleAppAction(app.key, action)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* MODULE ROWS */}
                    {!isCollapsed && (
                      <div
                        id={`permission-modules-${app.key}`}
                        className="permission-matrix-modules"
                      >
                        {app.modules.map((mod, modIdx) => (
                          <div
                            key={mod.key}
                            className={joinClassNames(
                              "permission-matrix-module-row",
                              modIdx % 2 === 0 &&
                                "permission-matrix-module-row-even",
                            )}
                          >
                            <div className="permission-matrix-module-main">
                              <span
                                className="permission-matrix-module-rail"
                                aria-hidden="true"
                              />

                              <span className="permission-matrix-module-copy">
                                <span className="permission-matrix-module-name">
                                  {mod.name}
                                </span>

                                <span className="permission-matrix-module-key">
                                  {mod.key}
                                </span>
                              </span>
                            </div>

                            {(["read", "write"] as Action[]).map((action) => {
                              const checked =
                                permState?.[app.key]?.[mod.key]?.[action] ??
                                false;

                              return (
                                <div
                                  key={action}
                                  className="permission-matrix-action-cell permission-matrix-module-action"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onChange={() =>
                                      togglePerm(app.key, mod.key, action)
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {filteredApps.length === 0 && (
                <div className="permission-matrix-empty">
                  No modules match “{search}”
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="permission-matrix-mobile-list">
          {filteredApps.map((app) => {
            const isCollapsed = collapsed[app.key];

            return (
              <section
                key={app.key}
                className="permission-matrix-mobile-card"
                aria-labelledby={`permission-mobile-app-${app.key}`}
              >
                <div className="permission-matrix-mobile-app">
                  <button
                    type="button"
                    className="permission-matrix-mobile-trigger"
                    onClick={() =>
                      setCollapsed((current) => ({
                        ...current,
                        [app.key]: !current[app.key],
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    aria-controls={`permission-mobile-modules-${app.key}`}
                  >
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={joinClassNames(
                        "permission-matrix-chevron",
                        isCollapsed && "permission-matrix-chevron-collapsed",
                      )}
                    />

                    <span className="permission-matrix-app-avatar">
                      {app.key.slice(0, 2).toUpperCase()}
                    </span>

                    <span className="permission-matrix-app-copy">
                      <span
                        id={`permission-mobile-app-${app.key}`}
                        className="permission-matrix-app-name"
                      >
                        {app.name}
                      </span>

                      <span className="permission-matrix-app-meta">
                        {app.key} · {app.modules.length} modules
                      </span>
                    </span>
                  </button>

                  <Button
                    type="button"
                    text="Select All"
                    appearance="ghost"
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleAppAll(app.key)}
                  />
                </div>

                <div className="permission-matrix-mobile-app-actions">
                  {ACTIONS.map((action) => {
                    const state = appActionState(app.key, action);

                    return (
                      <label
                        key={action}
                        className="permission-matrix-mobile-check-row"
                      >
                        <span>{action}</span>

                        <Checkbox
                          checked={state.all}
                          indeterminate={state.some}
                          onChange={() => toggleAppAction(app.key, action)}
                        />
                      </label>
                    );
                  })}
                </div>

                {!isCollapsed && (
                  <div
                    id={`permission-mobile-modules-${app.key}`}
                    className="permission-matrix-mobile-modules"
                  >
                    {app.modules.map((mod) => (
                      <div
                        key={mod.key}
                        className="permission-matrix-mobile-module"
                      >
                        <div className="permission-matrix-module-copy">
                          <span className="permission-matrix-module-name">
                            {mod.name}
                          </span>

                          <span className="permission-matrix-module-key">
                            {mod.key}
                          </span>
                        </div>

                        <div className="permission-matrix-mobile-module-actions">
                          {ACTIONS.map((action) => {
                            const checked =
                              permState?.[app.key]?.[mod.key]?.[action] ??
                              false;

                            return (
                              <label
                                key={action}
                                className="permission-matrix-mobile-check-row permission-matrix-mobile-check-row-compact"
                              >
                                <span>{action}</span>

                                <Checkbox
                                  checked={checked}
                                  onChange={() =>
                                    togglePerm(app.key, mod.key, action)
                                  }
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="permission-matrix-empty">
              No modules match “{search}”
            </div>
          )}
        </div>

        <div className="permission-matrix-footer">
          <Button
            text="Back"
            type="button"
            onClick={goBack}
            Icon={ArrowLeft}
            appearance="ghost"
            variant="secondary"
            size="sm"
          />

          <Button
            disabled={isLoading}
            onClick={collectPermissions}
            text={isLoading ? "Saving..." : "Save Permissions"}
            type="button"
            appearance="standard"
            variant="brand"
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}
