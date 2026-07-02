import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Database,
	Users,
	User,
	BriefcaseBusinessIcon,
} from "lucide-react";

export const vendorSidebar: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home size={18} />,
		link: "/vendor/dashboard",
	},
	{
		id: "users",
		label: "Vendor Listing",
		icon: <Users size={18} />,
		link: "/vendor/listing",
	},
	{
		id: "profiles",
		label: "User Profiles",
		icon: <User size={18} />,
		link: "/vendor/user_profiles",
	},
	{
		id: "masters",
		label: "Masters",
		icon: <Database size={18} />,
		link: "/vendor/masters",
	},
	{
		id: "business-partners",
		label: "Business Partners",
		icon: <BriefcaseBusinessIcon size={18} />,
		link: "/vendor/business-partners",
	},
];
