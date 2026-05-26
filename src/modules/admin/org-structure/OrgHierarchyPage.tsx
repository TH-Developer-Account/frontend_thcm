import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../../context/Auth/AuthContext";
import {
  fetchOrgTree,
  createOrgUnit,
  deleteOrgUnit,
  addMember,
  removeMember,
  searchWorkspaceUsers,
  fetchDepartments,
  fetchWorkspaceSettings,
  updatePeerToPeer,
  type OrgUnit,
  type OrgMember,
  type OrgMemberRole,
  type DesignationLevel,
  type WorkspaceUser,
  type Department,
  type Region,
} from "./Orgapi";

// ─── Tree helpers ─────────────────────────────────────────────────────────────

function buildTree(units: OrgUnit[]): OrgUnit[] {
  const map: Record<string, OrgUnit> = {};
  units.forEach((u) => (map[u.id] = { ...u, children: [] }));
  const roots: OrgUnit[] = [];
  units.forEach((u) => {
    if (u.parentId && map[u.parentId]) {
      map[u.parentId].children!.push(map[u.id]);
    } else {
      roots.push(map[u.id]);
    }
  });
  return roots;
}

function getAllDescendantIds(unitId: string, units: OrgUnit[]): string[] {
  const byParent: Record<string, string[]> = {};
  units.forEach((u) => {
    if (u.parentId)
      (byParent[u.parentId] = byParent[u.parentId] ?? []).push(u.id);
  });
  const result: string[] = [];
  const queue = [unitId];
  while (queue.length) {
    const cur = queue.shift()!;
    result.push(cur);
    (byParent[cur] ?? []).forEach((c) => queue.push(c));
  }
  return result;
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";
interface ToastMsg {
  id: number;
  kind: ToastKind;
  text: string;
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const show = useCallback((text: string, kind: ToastKind = "success") => {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, kind, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium border
          ${t.kind === "success" ? "bg-white border-green-100 text-green-800" : "bg-white border-red-100 text-red-700"}`}
        >
          {t.kind === "success" ? (
            <svg
              className="w-4 h-4 text-green-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-red-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
              />
            </svg>
          )}
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function Avatar({ first, last }: { first: string; last: string }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarColor(first)}`}
    >
      {getInitials(first, last)}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: OrgMemberRole }) {
  return role === "MANAGER" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      Manager
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Member
    </span>
  );
}

// ─── Designation Badge ────────────────────────────────────────────────────────

const DESIGNATION_META: Record<
  DesignationLevel,
  { label: string; style: string }
> = {
  HEAD: {
    label: "Head",
    style: "bg-purple-50 text-purple-700 border-purple-200",
  },
  DEPT_HEAD: {
    label: "Dept Head",
    style: "bg-orange-50 text-orange-700 border-orange-200",
  },
  ZONAL_HEAD: {
    label: "Zonal Head",
    style: "bg-amber-50  text-amber-700  border-amber-200",
  },
  AREA_HEAD: {
    label: "Area Head",
    style: "bg-sky-50    text-sky-700    border-sky-200",
  },
  MEMBER: {
    label: "Member",
    style: "bg-gray-100  text-gray-600   border-gray-200",
  },
};

function DesignationBadge({ level }: { level: DesignationLevel }) {
  const meta = DESIGNATION_META[level] ?? DESIGNATION_META.MEMBER;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.style}`}
    >
      {meta.label}
    </span>
  );
}

// ─── Peer-to-Peer Toggle ──────────────────────────────────────────────────────

interface P2PToggleProps {
  enabled: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  onToggle: () => void;
}

function P2PToggle({
  enabled,
  loading,
  isSuperAdmin,
  onToggle,
}: P2PToggleProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all
      ${
        enabled
          ? "bg-emerald-50 border-emerald-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* Icon */}
      <svg
        className={`w-4 h-4 flex-shrink-0 ${enabled ? "text-emerald-600" : "text-gray-400"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>

      {/* Label */}
      <div className="flex flex-col">
        <span
          className={`text-xs font-semibold leading-tight ${enabled ? "text-emerald-700" : "text-gray-600"}`}
        >
          Peer visibility
        </span>
        <span className="text-xs text-gray-400 leading-tight">
          {enabled
            ? "On — peers can see each other's EPCs"
            : "Off — own + subordinates only"}
        </span>
      </div>

      {/* Toggle switch — only clickable by super admin */}
      {isSuperAdmin ? (
        <button
          onClick={onToggle}
          disabled={loading}
          title={
            enabled
              ? "Disable peer-to-peer visibility"
              : "Enable peer-to-peer visibility"
          }
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full
            transition-colors duration-200 focus:outline-none
            ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
              ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`}
          />
        </button>
      ) : (
        /* Read-only indicator for non-super-admin */
        <div
          title="Only super admins can change this setting"
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full opacity-60 cursor-not-allowed
            ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
              ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  unit: OrgUnit;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  deptMap: Record<string, string>;
  regionMap: Record<string, string>;
  onSelect: (unit: OrgUnit) => void;
  onToggle: (id: string) => void;
  onDeleteUnit: (unit: OrgUnit) => void;
}

function TreeNode({
  unit,
  depth,
  selectedId,
  expandedIds,
  deptMap,
  regionMap,
  onSelect,
  onToggle,
  onDeleteUnit,
}: TreeNodeProps) {
  const hasChildren = (unit.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(unit.id);
  const isSelected = selectedId === unit.id;
  const managerCount = unit.members.filter((m) => m.role === "MANAGER").length;

  const scopeLabel = unit.departmentId
    ? `${deptMap[unit.departmentId] ?? "Dept"}${unit.regionId ? ` · ${regionMap[unit.regionId] ?? "Zone"}` : " · All zones"}`
    : "Company-wide";

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 select-none border
          ${isSelected ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50 border-transparent"}`}
        style={{ marginLeft: depth * 20 }}
        onClick={() => onSelect(unit)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(unit.id);
          }}
          className={`w-4 h-4 flex items-center justify-center rounded flex-shrink-0 text-gray-400 hover:text-gray-600 ${hasChildren ? "" : "invisible"}`}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${depth === 0 ? "bg-orange-100" : "bg-gray-100"}`}
        >
          {depth === 0 ? (
            <svg
              className="w-4 h-4 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${isSelected ? "text-orange-800" : "text-gray-800"}`}
          >
            {unit.name}
          </p>
          <p className="text-xs text-gray-400 truncate">{scopeLabel}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {managerCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium border border-orange-100">
              {managerCount}M
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
            {unit.members.length}
          </span>
        </div>

        {!hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUnit(unit);
            }}
            title="Delete unit"
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute border-l border-gray-100"
            style={{ left: depth * 20 + 22, top: 0, bottom: 8 }}
          />
          {unit.children!.map((child) => (
            <TreeNode
              key={child.id}
              unit={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              deptMap={deptMap}
              regionMap={regionMap}
              onSelect={onSelect}
              onToggle={onToggle}
              onDeleteUnit={onDeleteUnit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Unit Modal ───────────────────────────────────────────────────────────

interface AddUnitModalProps {
  workspaceId: string;
  parentUnit: OrgUnit | null;
  departments: Department[];
  regions: Region[];
  onClose: () => void;
  onCreated: (unit: OrgUnit) => void;
  toast: (text: string, kind?: "success" | "error") => void;
}

function AddUnitModal({
  workspaceId,
  parentUnit,
  departments,
  regions,
  onClose,
  onCreated,
  toast,
}: AddUnitModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const unit = await createOrgUnit({
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentUnit?.id ?? null,
        departmentId: departmentId || null,
        regionId: regionId || null,
      });
      toast(`Unit "${unit.name}" created`);
      onCreated(unit);
    } catch (err: any) {
      toast(err.message ?? "Failed to create unit", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-50 placeholder-gray-400 transition-all bg-white";
  const labelCls =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Create org unit
            </h3>
            {parentUnit && (
              <p className="text-xs text-gray-400 mt-0.5">
                Under{" "}
                <span className="font-medium text-gray-600">
                  {parentUnit.name}
                </span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>
              Unit name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Marketing — South Zone"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Description{" "}
              <span className="text-gray-300 font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this unit"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputCls}
            >
              <option value="">None — company-wide unit (HEAD level)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Leave blank for MD/VP level units.
            </p>
          </div>
          <div>
            <label className={labelCls}>Region / Zone</label>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className={inputCls}
            >
              <option value="">None — Dept Head level (all zones)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.region_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Leave blank for Dept Head level units.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? "Creating…" : "Create unit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

interface AddMemberModalProps {
  unit: OrgUnit;
  existingMemberIds: Set<string>;
  onClose: () => void;
  onAdded: (member: OrgMember) => void;
  toast: (text: string, kind?: "success" | "error") => void;
}

function AddMemberModal({
  unit,
  existingMemberIds,
  onClose,
  onAdded,
  toast,
}: AddMemberModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkspaceUser[]>([]);
  const [selected, setSelected] = useState<WorkspaceUser | null>(null);
  const [role, setRole] = useState<OrgMemberRole>("MEMBER");
  const [designation, setDesignation] = useState<DesignationLevel>("MEMBER");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDesignationChange(level: DesignationLevel) {
    setDesignation(level);
    setRole(level === "MEMBER" ? "MEMBER" : "MANAGER");
  }

  function handleRoleChange(r: OrgMemberRole) {
    setRole(r);
    if (r === "MEMBER") setDesignation("MEMBER");
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchWorkspaceUsers(value.trim());
        setResults(users.filter((u) => !existingMemberIds.has(u.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    try {
      const member = await addMember(unit.id, selected.id, role, designation);
      toast(
        `${selected.first_name} added as ${DESIGNATION_META[designation].label}`,
      );
      onAdded(member);
    } catch (err: any) {
      toast(err.message ?? "Failed to add member", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-50 placeholder-gray-400 transition-all";
  const labelCls =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Add member
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              To <span className="font-medium text-gray-600">{unit.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>
              Search workspace user <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                autoFocus
                value={
                  selected
                    ? `${selected.first_name} ${selected.last_name}`
                    : query
                }
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Name or email…"
                className={inputCls}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
            {!selected && results.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                {results.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelected(u);
                      setResults([]);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar first={u.first_name} last={u.last_name} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!selected && query && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                No users found
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Designation</label>
            <select
              value={designation}
              onChange={(e) =>
                handleDesignationChange(e.target.value as DesignationLevel)
              }
              className={inputCls + " bg-white"}
            >
              <option value="HEAD">
                Head (MD / VP — all depts, all zones)
              </option>
              <option value="DEPT_HEAD">
                Dept Head — all zones within dept
              </option>
              <option value="ZONAL_HEAD">
                Zonal Head — dept + zone filter
              </option>
              <option value="AREA_HEAD">Area Head — dept + zone filter</option>
              <option value="MEMBER">Member — own records only</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Controls which EPCs this user can see. Role is set automatically.
            </p>
          </div>

          <div>
            <label className={labelCls}>Role in this unit</label>
            <div className="flex gap-2">
              {(["MEMBER", "MANAGER"] as OrgMemberRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all
                    ${
                      role === r
                        ? r === "MANAGER"
                          ? "bg-orange-50 border-orange-300 text-orange-700"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                >
                  {r === "MANAGER" ? "Manager" : "Member"}
                </button>
              ))}
            </div>
            {role === "MANAGER" && (
              <p className="text-xs text-orange-600 mt-1.5">
                Only super admins can assign the Manager role.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected || loading}
            className="flex-1 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? "Adding…" : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm p-6 mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm rounded-lg font-medium text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-600 hover:bg-orange-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Members Table ────────────────────────────────────────────────────────────

interface MembersTableProps {
  unit: OrgUnit;
  allUnits: OrgUnit[];
  showSubtree: boolean;
  onToggleSubtree: () => void;
  onAddMember: () => void;
  onRemoveMember: (member: OrgMember) => void;
  loadingMembers: boolean;
  searchQuery: string;
  onSearch: (q: string) => void;
}

function MembersTable({
  unit,
  allUnits,
  showSubtree,
  onToggleSubtree,
  onAddMember,
  onRemoveMember,
  loadingMembers,
  searchQuery,
  onSearch,
}: MembersTableProps) {
  const unitMap = Object.fromEntries(allUnits.map((u) => [u.id, u]));
  const unitIds = showSubtree
    ? getAllDescendantIds(unit.id, allUnits)
    : [unit.id];

  const allMembers: Array<OrgMember & { unitName: string }> = unitIds.flatMap(
    (uid) =>
      (unitMap[uid]?.members ?? []).map((m) => ({
        ...m,
        unitName: unitMap[uid]?.name ?? "",
      })),
  );

  const filtered = allMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${m.user.first_name} ${m.user.last_name}`.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.unitName.toLowerCase().includes(q) ||
      (DESIGNATION_META[m.designationLevel]?.label ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  const managerCount = filtered.filter((m) => m.role === "MANAGER").length;
  const memberCount = filtered.filter((m) => m.role === "MEMBER").length;
  const colSpan = showSubtree ? 6 : 5;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{unit.name}</h2>
          {unit.description && (
            <p className="text-sm text-gray-400 mt-0.5">{unit.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {managerCount} manager{managerCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSubtree}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
              ${showSubtree ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
            Include subtree
          </button>
          <button
            onClick={onAddMember}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add member
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, email, unit, or designation…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-50 placeholder-gray-400 transition-all"
        />
      </div>

      <div className="flex-1 border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                Member
              </th>
              {showSubtree && (
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                  Unit
                </th>
              )}
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                Email
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                Designation
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                Role
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loadingMembers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  {showSubtree && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="text-center py-12 text-gray-400 text-sm"
                >
                  {searchQuery
                    ? "No members match your search"
                    : "No members in this unit yet"}
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr
                  key={`${member.id}-${member.unitName}`}
                  className="hover:bg-gray-50/70 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        first={member.user.first_name}
                        last={member.user.last_name}
                      />
                      <p className="font-medium text-gray-900">
                        {member.user.first_name} {member.user.last_name}
                      </p>
                    </div>
                  </td>
                  {showSubtree && (
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                        {member.unitName}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500">
                    {member.user.email}
                  </td>
                  <td className="px-4 py-3">
                    <DesignationBadge level={member.designationLevel} />
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Remove member"
                        onClick={() => onRemoveMember(member)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 p-3 text-right">
            {filtered.length} person{filtered.length !== 1 ? "s" : ""}
            {showSubtree ? " across subtree" : " in this unit"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySelection() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <svg
        className="w-12 h-12 text-gray-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
      <p className="text-sm">Select a unit from the tree to view its members</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrgHierarchyPage() {
  const { workspaceId, isSuperAdmin } = useAuth();

  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingMembers] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSubtree, setShowSubtree] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Peer-to-peer state
  const [p2pEnabled, setP2pEnabled] = useState(false);
  const [p2pLoading, setP2pLoading] = useState(false);

  // Modals
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitParent, setAddUnitParent] = useState<OrgUnit | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] =
    useState<OrgMember | null>(null);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<OrgUnit | null>(
    null,
  );

  const { toasts, show: toast } = useToast();

  // ── Load everything when workspaceId becomes available ─────────────────────
  useEffect(() => {
    if (!workspaceId) {
      setLoadingTree(true);
      return;
    }

    setLoadingTree(true);

    const loadAll = async () => {
      try {
        const [treeData, data, settings] = await Promise.all([
          fetchOrgTree(workspaceId),
          fetchDepartments(),
          fetchWorkspaceSettings(workspaceId),
        ]);

        setUnits(treeData);
        setDepartments(data.departments);
        setRegions(data.regions);
        setP2pEnabled(settings.peerToPeerEnabled);

        const roots = treeData.filter((u) => u.parentId === null);
        setExpandedIds(new Set(roots.map((u) => u.id)));
      } catch (err: any) {
        toast(err.message ?? "Failed to load org tree", "error");
      } finally {
        setLoadingTree(false);
      }
    };

    loadAll();
  }, [workspaceId]);

  // ── Peer-to-peer toggle handler ────────────────────────────────────────────
  async function handleP2PToggle() {
    if (!isSuperAdmin) return;
    setP2pLoading(true);
    try {
      const updated = await updatePeerToPeer(!p2pEnabled);
      setP2pEnabled(updated.peerToPeerEnabled);
      toast(
        updated.peerToPeerEnabled
          ? "Peer visibility enabled — peers can now see each other's EPCs"
          : "Peer visibility disabled — users see own and subordinates' EPCs only",
      );
    } catch (err: any) {
      toast(err.message ?? "Failed to update peer visibility", "error");
    } finally {
      setP2pLoading(false);
    }
  }

  const deptMap = Object.fromEntries(
    departments.map((d) => [d.id, d.department_name]),
  );
  const regionMap = Object.fromEntries(
    regions.map((r) => [r.id, r.region_name]),
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((unit: OrgUnit) => {
    setSelectedUnit(unit);
    setSearchQuery("");
    setShowSubtree(false);
  }, []);

  function handleUnitCreated(unit: OrgUnit) {
    setUnits((prev) => [...prev, { ...unit, members: unit.members ?? [] }]);
    if (unit.parentId)
      setExpandedIds((prev) => new Set([...prev, unit.parentId!]));
    setShowAddUnit(false);
    setAddUnitParent(null);
  }

  async function handleDeleteUnit(unit: OrgUnit) {
    try {
      await deleteOrgUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
      if (selectedUnit?.id === unit.id) setSelectedUnit(null);
      toast(`Unit "${unit.name}" deleted`);
    } catch (err: any) {
      toast(err.message ?? "Failed to delete unit", "error");
    } finally {
      setConfirmDeleteUnit(null);
    }
  }

  function handleMemberAdded(member: OrgMember) {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === selectedUnit?.id
          ? { ...u, members: [...u.members, member] }
          : u,
      ),
    );
    setSelectedUnit((prev) =>
      prev ? { ...prev, members: [...prev.members, member] } : prev,
    );
    setShowAddMember(false);
  }

  async function handleRemoveMember(member: OrgMember) {
    if (!selectedUnit) return;
    try {
      await removeMember(selectedUnit.id, member.user.id);
      const patch = (u: OrgUnit) =>
        u.id === selectedUnit.id
          ? {
              ...u,
              members: u.members.filter((m) => m.user.id !== member.user.id),
            }
          : u;
      setUnits((prev) => prev.map(patch));
      setSelectedUnit((prev) => (prev ? patch(prev) : prev));
      toast(`${member.user.first_name} removed from ${selectedUnit.name}`);
    } catch (err: any) {
      toast(err.message ?? "Failed to remove member", "error");
    } finally {
      setConfirmRemoveMember(null);
    }
  }

  const tree = buildTree(units);
  const totalManagers = units.reduce(
    (a, u) => a + u.members.filter((m) => m.role === "MANAGER").length,
    0,
  );
  const existingMemberIds = new Set(
    selectedUnit?.members.map((m) => m.user.id) ?? [],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back
            </button>
            <span className="text-gray-200 select-none">|</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Org Hierarchy
              </h1>
              <p className="text-xs text-gray-400">
                Manage reporting structure and role assignments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {units.length}
                </p>
                <p className="text-xs text-gray-400">Units</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div>
                <p className="text-lg font-semibold text-orange-600">
                  {totalManagers}
                </p>
                <p className="text-xs text-gray-400">Managers</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {units.reduce((a, u) => a + u.members.length, 0)}
                </p>
                <p className="text-xs text-gray-400">People</p>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-100" />

            {/* ✅ Peer-to-peer toggle */}
            <P2PToggle
              enabled={p2pEnabled}
              loading={p2pLoading}
              isSuperAdmin={!!isSuperAdmin}
              onToggle={handleP2PToggle}
            />

            <div className="w-px h-8 bg-gray-100" />

            <button
              onClick={() => {
                setAddUnitParent(null);
                setShowAddUnit(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create unit
            </button>
          </div>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left: Tree */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Organisation tree
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {loadingTree ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{ marginLeft: i > 1 ? 20 : 0 }}
                >
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-7 h-7 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : tree.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No units yet.
                <br />
                <button
                  onClick={() => {
                    setAddUnitParent(null);
                    setShowAddUnit(true);
                  }}
                  className="text-orange-600 hover:underline mt-1 inline-block"
                >
                  Create the first one
                </button>
              </div>
            ) : (
              tree.map((unit) => (
                <TreeNode
                  key={unit.id}
                  unit={unit}
                  depth={0}
                  selectedId={selectedUnit?.id ?? null}
                  expandedIds={expandedIds}
                  deptMap={deptMap}
                  regionMap={regionMap}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  onDeleteUnit={(u) => setConfirmDeleteUnit(u)}
                />
              ))
            )}

            {selectedUnit && (
              <div className="px-3 py-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setAddUnitParent(selectedUnit);
                    setShowAddUnit(true);
                  }}
                  className="w-full flex items-center gap-2 text-xs text-orange-600 hover:text-orange-700 font-medium py-1.5 px-2 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add child unit under "{selectedUnit.name}"
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Members */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">
          {selectedUnit ? (
            <MembersTable
              unit={selectedUnit}
              allUnits={units}
              showSubtree={showSubtree}
              onToggleSubtree={() => setShowSubtree((p) => !p)}
              onAddMember={() => setShowAddMember(true)}
              onRemoveMember={(m) => setConfirmRemoveMember(m)}
              loadingMembers={loadingMembers}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          ) : (
            <EmptySelection />
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddUnit && (
        <AddUnitModal
          workspaceId={workspaceId ?? ""}
          parentUnit={addUnitParent}
          departments={departments}
          regions={regions}
          onClose={() => {
            setShowAddUnit(false);
            setAddUnitParent(null);
          }}
          onCreated={handleUnitCreated}
          toast={toast}
        />
      )}

      {showAddMember && selectedUnit && (
        <AddMemberModal
          unit={selectedUnit}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowAddMember(false)}
          onAdded={handleMemberAdded}
          toast={toast}
        />
      )}

      {confirmRemoveMember && (
        <ConfirmDialog
          title="Remove member"
          message={`Remove ${confirmRemoveMember.user.first_name} ${confirmRemoveMember.user.last_name} from ${selectedUnit?.name}?`}
          confirmLabel="Remove"
          danger
          onConfirm={() => handleRemoveMember(confirmRemoveMember)}
          onCancel={() => setConfirmRemoveMember(null)}
        />
      )}

      {confirmDeleteUnit && (
        <ConfirmDialog
          title="Delete org unit"
          message={`Delete "${confirmDeleteUnit.name}"? This cannot be undone. The unit must have no members first.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteUnit(confirmDeleteUnit)}
          onCancel={() => setConfirmDeleteUnit(null)}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
