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
				id: "vendorInitiationListing",
				label: "Vendor Initiation Listing",
				icon: <Users size={18} />,
				link: "/vendor/initiation/listing",
			},
			{
				id: "vendorOnboardingListing",
				label: "Vendor Onboarding Listing",
				icon: <Users size={18} />,
				link: "/vendor/onboarding/listing",
			},
			{
				id: "vendorInitiationForm",
				label: "Vendor Initiation Form",
				icon: <Users size={18} />,
				link: "/vendor/initiation/create",
			},
			// {
			// 	id: "vendorOnboardingForm",
			// 	label: "Vendor Onboarding Form",
			// 	icon: <Users size={18} />,
			// 	link: "/vendor/onboarding/create",
			// },
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
