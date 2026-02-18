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
		link: "/marketing/dashboard",
	},
	{
		id: "epc",
		label: "EPC",
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
		id: "settings",
		label: "Settings",
		icon: <Settings />,
		link: "/profile",
	},
];
