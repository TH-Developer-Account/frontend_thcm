import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Settings,
	Database,
	// MapPinHouse,
	Users,
	User,
	BriefcaseBusinessIcon,
} from "lucide-react";

export const adminSidebar: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home />,
		link: "/admin/dashboard",
	},
	{
		id: "users",
		label: "Business Users",
		icon: <Users />,
		link: "/admin/users",
	},
	{
		id: "profiles",
		label: "User Profiles",
		icon: <User />,
		link: "/admin/user_profiles",
	},
	{
		id: "masters",
		label: "Masters",
		icon: <Database />,
		link: "/admin/masters",
	},
	{
		id: "dealers",
		label: "Dealers",
		icon: <BriefcaseBusinessIcon />,
		link: "/admin/dealers",
	},
	{
		id: "bydesign",
		label: "By Design Data",
		icon: <Database />,
		link: "/admin/bydesign",
	},
	{
		id: "c4c",
		label: "C4C Data",
		icon: <Database />,
		link: "/admin/c4c",
	},
	{
		id: "settings",
		label: "Settings",
		icon: <Settings />,
		link: "/admin/profile",
	},
];
