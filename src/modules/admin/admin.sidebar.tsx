// sidebar.config.ts
import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Settings,
	Table,
	// UserPen,
	Database,
	// CalendarDays,
	MapPinHouse,
	// Package,
	// File,
	FilePen,
	LayoutDashboard,
	Users,
} from "lucide-react";

export const adminSidebar: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home />,
		link: "/",
	},
	{
		id: "dashboard",
		label: "Dashboard",
		icon: <LayoutDashboard />,
		link: "/admin/dashboard",
	},
	{
		id: "masters",
		label: "Masters",
		icon: <Database />,
		link: "/admin/masters",
		children: [
			{
				id: "users",
				label: "Users",
				link: "/admin/users",
				icon: <Users size={18} />,
			},
			{
				id: "department",
				label: "Department",
				link: "/admin/department",
				icon: <Table size={18} />,
			},

			{
				id: "roles",
				label: "Roles",
				link: "/admin/roles",
				icon: <FilePen size={18} />,
			},
			{
				id: "branche",
				label: "Branches",
				icon: <MapPinHouse />,
				link: "/admin/branches",
			},
		],
	},

	{
		id: "settings",
		label: "Settings",
		icon: <Settings />,
		link: "/admin/profile",
	},
];
