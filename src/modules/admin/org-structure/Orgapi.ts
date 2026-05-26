// orgApi.ts — all API calls for the org hierarchy feature
// Uses ServerAxios (your existing axios instance with auth headers).

import { ServerAxios } from "../../../services/ServerAxios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgMemberRole = "MANAGER" | "MEMBER";

// ✅ NEW — drives which scoping filter applies in the backend
export type DesignationLevel =
  | "HEAD" // MD / VP — no dept, no zone filter
  | "DEPT_HEAD" // Marketing Head / Sales Head — dept filter only
  | "ZONAL_HEAD" // Zonal Head — dept + zone filter
  | "AREA_HEAD" // Area Head — dept + zone filter (tighter geography)
  | "MEMBER"; // Individual contributor — own records only

export interface OrgMemberUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface OrgMember {
  id: string;
  role: OrgMemberRole;
  orgUnitId?: string;
  // ✅ NEW — designation level for this member in this unit
  designationLevel: DesignationLevel;
  user: OrgMemberUser;
  orgUnit?: { id: string; name: string };
}

export interface OrgUnit {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  created_at?: string;
  // ✅ NEW — which department this unit belongs to (null = company-wide)
  departmentId: string | null;
  // ✅ NEW — which region/zone this unit covers (null = no zone filter)
  regionId: string | null;
  _count?: { members: number };
  members: OrgMember[];
  children?: OrgUnit[];
}

export interface WorkspaceUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// ✅ NEW — master data types for the create unit modal dropdowns
export interface Department {
  id: string;
  department_name: string;
  department_code: string;
}

export interface Region {
  id: string;
  region_name: string;
  region_code: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  peerToPeerEnabled: boolean;
}

// ─── Org Unit endpoints ───────────────────────────────────────────────────────

export async function fetchOrgTree(workspaceId: string): Promise<OrgUnit[]> {
  const {
    data: { data },
  } = await ServerAxios.get(`/org-structure?workspaceId=${workspaceId}`);
  return data;
}

export async function createOrgUnit(payload: {
  workspaceId: string;
  name: string;
  description?: string;
  parentId?: string | null;
  // ✅ NEW — required for correct scoping filter on the backend
  departmentId?: string | null;
  regionId?: string | null;
}): Promise<OrgUnit> {
  const res = await ServerAxios.post("/org-structure", payload);
  return res.data;
}

export async function deleteOrgUnit(unitId: string): Promise<void> {
  await ServerAxios.delete(`/org-structure/${unitId}`);
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

export async function fetchMembers(unitId: string): Promise<OrgMember[]> {
  const res = await ServerAxios.get(`/org-structure/${unitId}/members`);
  return res.data;
}

export async function addMember(
  unitId: string,
  userId: string,
  role: OrgMemberRole,
  // ✅ NEW — must be sent to backend so scoping filter works correctly
  designationLevel: DesignationLevel,
): Promise<OrgMember> {
  const res = await ServerAxios.post(`/org-structure/${unitId}/members`, {
    userId,
    role,
    designationLevel, // ✅ NEW
  });
  return res.data;
}

export async function removeMember(
  unitId: string,
  userId: string,
): Promise<void> {
  await ServerAxios.delete(`/org-structure/${unitId}/members/${userId}`);
}

// ─── Workspace users (for the add-member search dropdown) ────────────────────

export async function searchWorkspaceUsers(
  query: string,
): Promise<WorkspaceUser[]> {
  const res = await ServerAxios.get(
    `/users?search=${encodeURIComponent(query)}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

// ─── Master data endpoints (for create unit modal dropdowns) ──────────────────
// ✅ NEW — adjust paths to match your actual master data routes

export async function fetchDepartments(): Promise<Department[] | Region[]> {
  const res = await ServerAxios.get("/master-data");
  return res.data;
}

// ─── Workspace settings endpoints ─────────────────────────────────────────────
// ✅ NEW

export async function fetchWorkspaceSettings(
  id: string,
): Promise<WorkspaceSettings> {
  const res = await ServerAxios.get(`/workspaces/${id}`);
  return res.data.data;
}

export async function updatePeerToPeer(
  enabled: boolean,
): Promise<WorkspaceSettings> {
  const res = await ServerAxios.patch("/workspaces/peer-to-peer", {
    enabled,
  });
  return res.data.data;
}
