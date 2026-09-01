import type { SidebarItem } from "../../layout/layout.types";
import { Users } from "lucide-react";

export const vendorSidebar: SidebarItem[] = [
	// {
	// 	id: "home",
	// 	label: "Home",
	// 	icon: <Home size={18} />,
	// 	link: "/vendor/dashboard",
	// },

	{
		id: "vendorOnboardingListing",
		label: "Vendor Onboarding Listing",
		icon: <Users size={18} />,
		permission: {
			app: "VENDOR_ONBOARDING",
			module: "VENDOR_INITIATION",
			action: "write",
		},
		link: "/vendor/onboarding/listing",
		// children: [
		// 	// {
		// 	// 	id: "vendorInitiationListing",
		// 	// 	label: "Vendor Initiation Listing",
		// 	// 	icon: <Users size={18} />,
		// 	// 	link: "/vendor/initiation/listing",
		// 	// },
		// 	{
		// 		id: "vendorOnboardingListing",
		// 		label: "Vendor Onboarding Listing",

		// 		link: "/vendor/onboarding/listing",
		// 	},
		// ],
	},
];
