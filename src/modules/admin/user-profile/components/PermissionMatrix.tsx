import React from "react";
import Checkbox from "../../../../components/FormElements/Checkbox";
import { SearchInput } from "../../../../components/FormElements/SearchInput";
import { Badge } from "../../../../components/common/Badge";
import type { WorkspacePayload } from "../types/profile.types";

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

interface Props {
  filteredApps: AppItem[];
  collapsed: Record<string, boolean>;
  permState: PermState;

  search: string;
  setSearch: (v: string) => void;
  setCollapsed: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // appState: (app: string) => { all: boolean; some: boolean };
  appActionState: (
    app: string,
    action: Action,
  ) => { all: boolean; some: boolean };

  // modState: (app: string, mod: string) => { all: boolean; some: boolean };

  toggleAppAll: (app: string) => void;
  toggleAppAction: (app: string, action: Action) => void;
  // toggleModule: (app: string, mod: string) => void;
  togglePerm: (app: string, mod: string, action: Action) => void;
  onSavePermissions: (data: WorkspacePayload) => void;
  isLoading: boolean;
}

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
  onSavePermissions,
}: Props) {
  const collectPermissions = () => {
    const permissions: WorkspacePayload = [];

    Object.entries(permState).forEach(([appKey, modules]) => {
      Object.entries(modules).forEach(([moduleKey, perms]) => {
        if (perms.read) {
          permissions.push({
            action: "read",
            appKey,
            moduleKey,
          });
        }

        if (perms.write) {
          permissions.push({
            action: "write",
            appKey,
            moduleKey,
          });
        }
      });
    });

    onSavePermissions(permissions);
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-md">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/70 backdrop-blur-sm">
        <div>
          <Badge variant="primary">03</Badge>
          <span className="text-sm font-semibold text-slate-800 flex-1 ml-2">
            Permissions Matrix
          </span>
        </div>

        <div className="relative">
          <SearchInput
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder="Search modules..."
            onClear={() => setSearch("")}
          />
        </div>
      </div>

      {/* COLUMN HEADER */}
      <div className="grid grid-cols-[1fr_88px_88px] border-b border-slate-200 bg-slate-50">
        <div className="px-6 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          App / Module
        </div>

        <div className="flex items-center justify-center text-[10px] font-semibold text-blue-600 tracking-wide border-l border-slate-200">
          Read
        </div>

        <div className="flex items-center justify-center text-[10px] font-semibold text-emerald-600 tracking-wide border-l border-slate-200">
          Write
        </div>
      </div>

      {/* BODY */}
      <div className="max-h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {filteredApps.map((app) => {
          const isCollapsed = collapsed[app.key];
          return (
            <div
              key={app.key}
              className="border-b border-slate-100 last:border-none"
            >
              {/* APP ROW */}
              <div className="grid grid-cols-[1fr_88px_88px] bg-slate-50/60 hover:bg-slate-50 transition">
                <div
                  className="flex items-center gap-3 px-6 py-3 cursor-pointer"
                  onClick={() =>
                    setCollapsed((c) => ({
                      ...c,
                      [app.key]: !c[app.key],
                    }))
                  }
                >
                  <span
                    className={`text-slate-400 text-sm transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  >
                    ▾
                  </span>

                  <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shadow-sm">
                    {app.key.slice(0, 2)}
                  </div>

                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-slate-800">
                      {app.name}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {app.key} · {app.modules.length} modules
                    </div>
                  </div>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAppAll(app.key);
                    }}
                    className="ml-auto"
                  >
                    {/* <Checkbox
                      checked={as.all}
                      indeterminate={as.some}
                      onChange={() => toggleAppAll(app.key)}
                    /> */}
                  </div>
                </div>

                {/* APP ACTIONS */}
                {(["read", "write"] as Action[]).map((action) => {
                  const aas = appActionState(app.key, action);

                  return (
                    <div
                      key={action}
                      className="flex items-center justify-center border-l border-slate-200 cursor-pointer hover:bg-white transition"
                      onClick={() => toggleAppAction(app.key, action)}
                    >
                      <Checkbox
                        checked={aas.all}
                        indeterminate={aas.some}
                        onChange={() => toggleAppAction(app.key, action)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* MODULE ROWS */}
              {!isCollapsed &&
                app.modules.map((mod, modIdx) => {
                  // const ms = modState(app.key, mod.key);

                  return (
                    <div
                      key={mod.key}
                      className={`grid grid-cols-[1fr_88px_88px] ${
                        modIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      } hover:bg-slate-50 transition`}
                    >
                      <div className="flex items-center gap-3 pl-14 pr-5 py-2.5">
                        <div className="w-[2px] h-6 bg-slate-200 rounded"></div>
                        <div className="leading-tight">
                          <div className="text-sm font-medium text-slate-700">
                            {mod.name}
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono">
                            {mod.key}
                          </div>
                        </div>
                      </div>

                      {(["read", "write"] as Action[]).map((action) => {
                        const on =
                          permState?.[app.key]?.[mod.key]?.[action] ?? false;

                        return (
                          <div
                            key={action}
                            className="flex items-center justify-center border-l border-slate-200 hover:bg-white transition"
                          >
                            <Checkbox
                              checked={on}
                              onChange={() =>
                                togglePerm(app.key, mod.key, action)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {filteredApps.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">
            No modules match "{search}"
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
        <button
          disabled={isLoading}
          onClick={collectPermissions}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          Save Permissions
        </button>
      </div>
    </div>
  );
}
