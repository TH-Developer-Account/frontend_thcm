import type { SidebarItem } from "../../layout/layout.types";
import {
	Home,
	Database,
	Users,
	User,
	BriefcaseBusinessIcon,
	Folder,
} from "lucide-react";

export const vendorSidebar: SidebarItem[] = [
	{
		id: "home",
		label: "Home",
		icon: <Home size={18} />,
		link: "/vendor/dashboard",
	},

	{
		id: "vendor",
		label: "Vendor Onboarding",
		icon: <Folder size={20} />,
		// permission: {
		// 	app: "GENERAL_FORMS",
		// 	module: "VENDOR_ONBOARDING",
		// 	action: "read",
		// },
		children: [
			{
				id: "users",
				label: "Vendor Listing",
				icon: <Users size={18} />,
				link: "/vendor/listing",
			},
			{
				id: "vendorInitiation",
				label: "Vendor Initiation Form",
				icon: <Users size={18} />,
				link: "/vendor/create",
			},
			{
				id: "vendorOnboarding",
				label: "Vendor Onboarding Form",
				icon: <Users size={18} />,
				link: "/vendor/onboard/create",
			},
		],
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
