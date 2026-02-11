// sidebar.config.ts
import type { SidebarItem } from "../../layout/sidebar.types";
import {
	Home,
	Settings,
	BarChart,
	ClipboardList,
	CalendarDays,
} from "lucide-react";

export const sidebarItems: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home />,
		link: "/",
	},
	{
		id: "epc-listing",
		label: "EPC Listing",
		icon: <ClipboardList />,
		link: "/listing",
	},
	{
		id: "analytics",
		label: "Analytics",
		icon: <BarChart />,
	},
	{
		id: "epc",
		label: "EPC",
		icon: <CalendarDays />,
		link: "/epc",
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings />,
		link: "#",
	},
];
