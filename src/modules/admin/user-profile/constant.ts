// ─────────────────────────────────────────────
//  CONSTANTS & DATA
// ─────────────────────────────────────────────

import type { ProfileDTO, WorkspacePayload } from "./profile.types";

export const WORKSPACE_APPS = [
	{
		key: "MAP",
		name: "Marketing Activity Planner",
		enabled: true,
		modules: [
			{ key: "EPC", name: "Event Planning Calendar" },
			{ key: "EPF", name: "Event Proposal Form" },
			{ key: "CRF", name: "Collateral Requisition Form" },
			{ key: "LEADS", name: "Leads Aquisition Form" },
			{ key: "OPP", name: "Customer Opportunities" },
		],
	},
	{
		key: "PS",
		name: "Product Selector",
		enabled: true,
		modules: [
			{ key: "LEADS", name: "Leads Management" },
			{ key: "OPP", name: "Opportunities" },
		],
	},
];

export const DEFAULT_PERMISSIONS = () => {
	const permissions: Record<string, { read: boolean; write: boolean }> = {};

	WORKSPACE_APPS.forEach((app) => {
		app.modules.forEach((module) => {
			permissions[module.key] = { read: false, write: false };
		});
	});

	return permissions;
};
export const ALL_USERS = [
	{
		id: "u1",
		name: "Arjun Mehta",
		email: "arjun@corp.io",
		avatar: "AM",
		dept: "Engineering",
	},
	{
		id: "u2",
		name: "Priya Nair",
		email: "priya@corp.io",
		avatar: "PN",
		dept: "Design",
	},
	{
		id: "u3",
		name: "Rohan Verma",
		email: "rohan@corp.io",
		avatar: "RV",
		dept: "Product",
	},
	{
		id: "u4",
		name: "Sneha Das",
		email: "sneha@corp.io",
		avatar: "SD",
		dept: "Marketing",
	},
	{
		id: "u5",
		name: "Kiran Rao",
		email: "kiran@corp.io",
		avatar: "KR",
		dept: "Finance",
	},
	{
		id: "u6",
		name: "Anita Sharma",
		email: "anita@corp.io",
		avatar: "AS",
		dept: "HR",
	},
	{
		id: "u7",
		name: "Vijay Kumar",
		email: "vijay@corp.io",
		avatar: "VK",
		dept: "Sales",
	},
	{
		id: "u8",
		name: "Meera Pillai",
		email: "meera@corp.io",
		avatar: "MP",
		dept: "Support",
	},
];

export const INITIAL_PROFILES: ProfileDTO[] = [
	{
		name: "Super Administrator",
		description: "Full access to everything",
		permissions: [
			{ action: "read", scopeType: "WORKSPACE" },
			{ action: "write", scopeType: "WORKSPACE" },
		],
	},
	{
		name: "Sales Manager",
		description: "Write access to MAP, read everywhere else",
		permissions: [
			{ action: "read", scopeType: "WORKSPACE" },
			{ action: "write", scopeType: "APP", appKey: "MAP" },
		],
	},
	{
		name: "Finance Analyst",
		description: "Read/write access to CRM only",
		permissions: [
			{ action: "read", scopeType: "APP", appKey: "CRM" },
			{ action: "write", scopeType: "APP", appKey: "CRM" },
		],
	},
];

export const ROLE_OPTIONS = [
	{ value: "admin", label: "Administrator" },
	{ value: "manager", label: "Manager" },
	{ value: "analyst", label: "Analyst" },
	{ value: "executive", label: "Executive" },
	{ value: "agent", label: "Agent" },
	{ value: "viewer", label: "Viewer" },
];

export const WORKSPACE_PAYLOAD: WorkspacePayload = {
	workSpaceName: "Tata Hitachi Workspace",
	apps: WORKSPACE_APPS,
	profiles: INITIAL_PROFILES,
};

export const ACCENT_COLORS = [
	"#f59e0b",
	"#10b981",
	"#6366f1",
	"#ec4899",
	"#0ea5e9",
	"#f97316",
	"#8b5cf6",
	"#14b8a6",
];
// profileForm.config.ts

export const PROFILE_PERMISSION_TEXT = {
	title: "Module Permissions",
	quickLabel: "Quick:",
	quickActions: {
		allRead: "All Read",
		grantAll: "Grant All",
		revokeAll: "Revoke All",
	},
	counters: {
		read: "Read",
		write: "Write",
	},
	buttons: {
		back: "Back",
		discard: "Discard",
		create: "Create Profile",
		update: "Update Profile",
	},
};
// export const QUICK_ACTIONS = [
// 	{ key: "allRead", color: "sky", action: grantReadAll },
// 	{ key: "grantAll", color: "emerald", action: grantAll },
// 	{ key: "revokeAll", color: "red", action: revokeAll },
// ];

export const sections = [
	{ id: "general", label: "General", icon: "📋" },
	// { id: "users", label: "Assign Users", icon: "👥" },
	{ id: "permissions", label: "Permissions", icon: "🔐" },
];
