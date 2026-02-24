// ─────────────────────────────────────────────
//  CONSTANTS & DATA
// ─────────────────────────────────────────────

import type { Profile } from "./profile.types";

export const MODULES = [
	{ id: "crm", name: "CRM", icon: "👥", category: "Sales" },
	{ id: "analytics", name: "Analytics", icon: "📊", category: "Insights" },
	{ id: "finance", name: "Finance", icon: "💰", category: "Operations" },
	{ id: "hr", name: "HR Management", icon: "🏢", category: "People" },
	{ id: "projects", name: "Project Mgmt", icon: "📁", category: "Work" },
	{ id: "inventory", name: "Inventory", icon: "📦", category: "Operations" },
	{ id: "reports", name: "Reports", icon: "📄", category: "Insights" },
	{ id: "settings", name: "Settings", icon: "⚙️", category: "System" },
	{ id: "marketing", name: "Marketing", icon: "📣", category: "Sales" },
	{ id: "support", name: "Support", icon: "🎧", category: "People" },
];

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

export const DEFAULT_PERMISSIONS = () =>
	Object.fromEntries(MODULES.map((m) => [m.id, { read: false, write: false }]));

export const INITIAL_PROFILES: Profile[] = [
	{
		id: "p1",
		name: "Super Administrator",
		description: "Full access to all modules and system settings",
		role: "admin",
		status: "active",
		color: "#f59e0b",
		assignedUsers: ["u1", "u3"],
		permissions: Object.fromEntries(
			MODULES.map((m) => [m.id, { read: true, write: true }]),
		),
		createdAt: "2024-01-10",
		updatedAt: "2025-01-15",
	},
	{
		id: "p2",
		name: "Sales Manager",
		description: "Access to CRM, Marketing, and Reports modules",
		role: "manager",
		status: "active",
		color: "#10b981",
		assignedUsers: ["u4", "u7"],
		permissions: {
			...DEFAULT_PERMISSIONS(),
			crm: { read: true, write: true },
			marketing: { read: true, write: true },
			reports: { read: true, write: false },
			analytics: { read: true, write: false },
		},
		createdAt: "2024-02-20",
		updatedAt: "2025-02-01",
	},
	{
		id: "p3",
		name: "Finance Analyst",
		description: "Read/Write access to Finance and Reports",
		role: "analyst",
		status: "active",
		color: "#6366f1",
		assignedUsers: ["u5"],
		permissions: {
			...DEFAULT_PERMISSIONS(),
			finance: { read: true, write: true },
			reports: { read: true, write: true },
			analytics: { read: true, write: false },
		},
		createdAt: "2024-03-05",
		updatedAt: "2025-01-28",
	},
	{
		id: "p4",
		name: "HR Executive",
		description: "Manage HR and partial access to Reports",
		role: "executive",
		status: "inactive",
		color: "#ec4899",
		assignedUsers: ["u6"],
		permissions: {
			...DEFAULT_PERMISSIONS(),
			hr: { read: true, write: true },
			reports: { read: true, write: false },
		},
		createdAt: "2024-04-12",
		updatedAt: "2024-12-10",
	},
	{
		id: "p5",
		name: "Support Agent",
		description: "Access to Support ticketing system only",
		role: "agent",
		status: "active",
		color: "#0ea5e9",
		assignedUsers: ["u2", "u8"],
		permissions: {
			...DEFAULT_PERMISSIONS(),
			support: { read: true, write: true },
		},
		createdAt: "2024-05-18",
		updatedAt: "2025-02-10",
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
	{ id: "users", label: "Assign Users", icon: "👥" },
	{ id: "permissions", label: "Permissions", icon: "🔐" },
];
