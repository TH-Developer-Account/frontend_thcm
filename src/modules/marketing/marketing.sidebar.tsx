// sidebar.config.ts
import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Settings,
	Table,
	CalendarDays,
	LayoutDashboard,
	Users,
	Upload,
} from "lucide-react";

export const marketingSidebar: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home size={20} />,
		link: "/",
	},
	{
		id: "dashboard",
		label: "Dashboard",
		icon: <LayoutDashboard size={20} />,
		link: "/marketing/dashboard",
	},
	{
		id: "epc",
		label: "Activity Planner",
		icon: <CalendarDays size={20} />,
		link: "/marketing/activity-planner/epc",
		permission: {
			app: "MAP",
			module: "EPC",
			action: "read",
		},
		children: [
			{
				id: "epc-list",
				label: "EPC Listing",
				link: "/marketing/activity-planner/listing",
				icon: <Table size={18} />,
				permission: {
					app: "MAP",
					module: "EPC",
					action: "read",
				},
			},
			{
				id: "lead-list",
				label: "Leads Listing",
				link: "/marketing/activity-planner/leads/listing",
				icon: <Users size={18} />,
				permission: {
					app: "MAP",
					module: "Leads",
					action: "read",
				},
			},
			{
				id: "file-module",
				label: "Import/Export Module",
				link: "/marketing/activity-planner/file-module/listing",
				icon: <Upload size={18} />,
				permission: {
					app: "MAP",
					module: "file-module",
					action: "read",
				},
			},
		],
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings size={20} />,
		link: "/marketing/profile",
	},
];
