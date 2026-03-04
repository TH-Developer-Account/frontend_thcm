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
		icon: <Home />,
		link: "/",
	},
	{
		id: "dashboard",
		label: "Dashboard",
		icon: <LayoutDashboard />,
		link: "/marketing/dashboard",
	},
	{
		id: "epc",
		label: "Activity Planner",
		icon: <CalendarDays />,
		link: "/marketing/epc",
		children: [
			{
				id: "epc-list",
				label: "EPC Listing",
				link: "/marketing/listing",
				icon: <Table size={18} />,
			},
			{
				id: "epc-create",
				label: "Create EPC",
				link: "/marketing/epc",
				icon: <FilePen size={18} />,
			},

			{
				id: "epf-create",
				label: "Create EPF",
				link: "/marketing/epf",
				icon: <FilePen size={18} />,
			},
			{
				id: "crf",
				label: "Create CRF",
				icon: <Package />,
				link: "/marketing/crf",
			},
		],
	},
	{
		id: "users",
		label: "User Management",
		link: "/marketing/admin/users",
		icon: <Users size={18} />,
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
		icon: <Settings />,
		link: "/marketing/profile",
	},
];
