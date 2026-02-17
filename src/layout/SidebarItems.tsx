// sidebar.config.ts
import type { SidebarItem } from "./layout.types";
import {
	Home,
	Settings,
	Table,
	// UserPen,
	CalendarDays,
	Package,
	// File,
	FilePen,
	LayoutDashboard,
} from "lucide-react";

export const sidebarItems: SidebarItem[] = [
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
		link: "/dashboard",
	},
	{
		id: "epc",
		label: "EPC",
		icon: <CalendarDays />,
		link: "/epc",
		children: [
			{
				id: "epc-create",
				label: "Create EPC",
				link: "/epc",
				icon: <FilePen size={18} />,
			},
			{
				id: "epc-list",
				label: "EPC Listing",
				link: "/listing",
				icon: <Table size={18} />,
			},
		],
	},

	{
		id: "crf",
		label: "CRF",
		icon: <Package />,
		link: "/crf",
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings />,
		link: "/profile",
	},
];
