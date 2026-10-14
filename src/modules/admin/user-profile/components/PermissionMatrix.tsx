import { ArrowLeft } from "lucide-react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";

import type { ActionCheckboxState } from "../hooks/userPermissionMatrix";
import type {
  AppDefinition,
  ModuleDefinition,
  ModulePermissionState,
  Permission,
} from "../types/profile.types";

type PermissionMatrixProps = {
  app: AppDefinition;
  visibleModules: ModuleDefinition[];
  permissionState: ModulePermissionState;
  search: string;
  onSearchChange: (value: string) => void;
  getActionCheckboxState: (action: Permission) => ActionCheckboxState;
  onToggleAll: () => void;
  onToggleAction: (action: Permission) => void;
  onToggleModule: (moduleKey: string, action: Permission) => void;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
};

const ACTIONS: Permission[] = ["read", "write"];

const joinClassNames = (
  ...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

export default function PermissionMatrix({
  app,
  visibleModules,
  permissionState,
  search,
  onSearchChange,
  getActionCheckboxState,
  onToggleAll,
  onToggleAction,
  onToggleModule,
  isSaving,
  onSave,
  onBack,
}: PermissionMatrixProps) {
  const isModuleChecked = (moduleKey: string, action: Permission) =>
    permissionState[moduleKey]?.[action] ?? false;

  const appIdentity = (
    <>
      <span className="permission-matrix-app-avatar">
        {app.appKey.slice(0, 2).toUpperCase()}
      </span>
      <span className="permission-matrix-app-copy">
        <span className="permission-matrix-app-name">{app.appName}</span>
        <span className="permission-matrix-app-meta">
          {app.appKey} · {app.modules.length} modules
        </span>
      </span>
    </>
  );

  const selectAllButton = (
    <Button
      type="button"
      text="Select All"
      appearance="ghost"
      variant="secondary"
      size="sm"
      onClick={onToggleAll}
    />
  );

  const emptyState =
    visibleModules.length === 0 ? (
      <div className="permission-matrix-empty">
        {search.trim()
          ? `No modules match “${search}”`
          : "This app has no modules to configure."}
      </div>
    ) : null;

  return (
    <Card
      title="Permissions Matrix"
      actions={
        <div className="w-full min-w-0 sm:w-72">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search modules..."
          />
        </div>
      }
    >
      <div className="permission-matrix">
        {/* DESKTOP / TABLET */}
        <div className="permission-matrix-table-shell scrollbar-sleek">
          <div className="permission-matrix-table">
            <div className="permission-matrix-header">
              <div className="permission-matrix-header-cell permission-matrix-header-main">
                Module
              </div>
              <div className="permission-matrix-header-cell permission-matrix-action-cell">
                Read
              </div>
              <div className="permission-matrix-header-cell permission-matrix-action-cell">
                Write
              </div>
            </div>

            <div className="permission-matrix-body">
              <section className="permission-matrix-group">
                <div className="permission-matrix-app-row">
                  <div className="permission-matrix-app-main-cell">
                    <span className="permission-matrix-app-trigger">
                      {appIdentity}
                    </span>
                    {selectAllButton}
                  </div>

                  {ACTIONS.map((action) => {
                    const state = getActionCheckboxState(action);
                    return (
                      <div
                        key={action}
                        className="permission-matrix-action-cell permission-matrix-app-action"
                      >
                        <Checkbox
                          checked={state.all}
                          indeterminate={state.some}
                          onChange={() => onToggleAction(action)}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="permission-matrix-modules">
                  {visibleModules.map((appModule, index) => (
                    <div
                      key={appModule.key}
                      className={joinClassNames(
                        "permission-matrix-module-row",
                        index % 2 === 0 && "permission-matrix-module-row-even",
                      )}
                    >
                      <div className="permission-matrix-module-main">
                        <span
                          className="permission-matrix-module-rail"
                          aria-hidden="true"
                        />
                        <span className="permission-matrix-module-copy">
                          <span className="permission-matrix-module-name">
                            {appModule.name}
                          </span>
                          <span className="permission-matrix-module-key">
                            {appModule.key}
                          </span>
                        </span>
                      </div>

                      {ACTIONS.map((action) => (
                        <div
                          key={action}
                          className="permission-matrix-action-cell permission-matrix-module-action"
                        >
                          <Checkbox
                            checked={isModuleChecked(appModule.key, action)}
                            onChange={() =>
                              onToggleModule(appModule.key, action)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              {emptyState}
            </div>
          </div>
        </div>

        {/* MOBILE */}
        <div className="permission-matrix-mobile-list">
          <section className="permission-matrix-mobile-card">
            <div className="permission-matrix-mobile-app">
              <span className="permission-matrix-mobile-trigger">
                {appIdentity}
              </span>
              {selectAllButton}
            </div>

            <div className="permission-matrix-mobile-app-actions">
              {ACTIONS.map((action) => {
                const state = getActionCheckboxState(action);
                return (
                  <label
                    key={action}
                    className="permission-matrix-mobile-check-row"
                  >
                    <span>{action}</span>
                    <Checkbox
                      checked={state.all}
                      indeterminate={state.some}
                      onChange={() => onToggleAction(action)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="permission-matrix-mobile-modules">
              {visibleModules.map((appModule) => (
                <div
                  key={appModule.key}
                  className="permission-matrix-mobile-module"
                >
                  <div className="permission-matrix-module-copy">
                    <span className="permission-matrix-module-name">
                      {appModule.name}
                    </span>
                    <span className="permission-matrix-module-key">
                      {appModule.key}
                    </span>
                  </div>

                  <div className="permission-matrix-mobile-module-actions">
                    {ACTIONS.map((action) => (
                      <label
                        key={action}
                        className="permission-matrix-mobile-check-row permission-matrix-mobile-check-row-compact"
                      >
                        <span>{action}</span>
                        <Checkbox
                          checked={isModuleChecked(appModule.key, action)}
                          onChange={() => onToggleModule(appModule.key, action)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {emptyState}
        </div>

        <div className="permission-matrix-footer">
          <Button
            text="Back"
            type="button"
            onClick={onBack}
            Icon={ArrowLeft}
            appearance="ghost"
            variant="secondary"
            size="sm"
          />
          <Button
            disabled={isSaving}
            onClick={onSave}
            text={isSaving ? "Saving..." : "Save Permissions"}
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
