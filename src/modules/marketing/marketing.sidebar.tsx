// sidebar.config.ts
import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Settings,
	Table,
	CalendarDays,
	Package,
	FilePen,
	LayoutDashboard,
	// Database,
	// MapPinHouse,
	Users,
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
		link: "/marketing/epc",
		permission: {
			app: "MAP",
			module: "EPC",
			action: "read",
		},
		children: [
			{
				id: "epc-list",
				label: "EPC Listing",
				link: "/marketing/listing",
				icon: <Table size={18} />,
				permission: {
					app: "MAP",
					module: "EPC",
					action: "read",
				},
			},
			{
				id: "epc-create",
				label: "Create EPC",
				link: "/marketing/epc",
				icon: <FilePen size={18} />,
				permission: {
					app: "MAP",
					module: "EPC",
					action: "write",
				},
			},

			{
				id: "epf-create",
				label: "Create EPF",
				link: "/marketing/epf",
				icon: <FilePen size={18} />,
				permission: {
					app: "MAP",
					module: "EPF",
					action: "write",
				},
			},
			{
				id: "crf",
				label: "Create CRF",
				icon: <Package size={18} />,
				link: "/marketing/crf",
				permission: {
					app: "MAP",
					module: "CRF",
					action: "write",
				},
			},
		],
	},
	{
		id: "users",
		label: "User Management",
		link: "/marketing/admin/users",
		icon: <Users size={20} />,
	},
	// {
	// 	id: "masters",
	// 	label: "Masters",
	// 	icon: <Database />,
	// 	link: "/admin/masters",
	// 	children: [
	// 		{
	// 			id: "users",
	// 			label: "Users",
	// 			link: "/marketing/admin/users",
	// 			icon: <Users size={18} />,
	// 		},
	// 		{
	// 			id: "department",
	// 			label: "Department",
	// 			link: "/marketing/admin/department",
	// 			icon: <Table size={18} />,
	// 		},

	// 		{
	// 			id: "roles",
	// 			label: "Roles",
	// 			link: "/marketing/admin/roles",
	// 			icon: <FilePen size={18} />,
	// 		},
	// 		{
	// 			id: "branche",
	// 			label: "Branches",
	// 			icon: <MapPinHouse />,
	// 			link: "/marketing/admin/branches",
	// 		},
	// 	],
	// },

	{
		id: "settings",
		label: "Settings",
		icon: <Settings size={20} />,
		link: "/marketing/profile",
	},
];
