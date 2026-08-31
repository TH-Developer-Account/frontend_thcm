// modules/guest/GuestSidebar.tsx
import { Folder } from "lucide-react";
import type { SidebarItem } from "../../layout/layout.types";

export const guestSidebar: SidebarItem[] = [
	{
		id: "guest-medical-claim-listing",
		label: "Forms Listing",
		icon: <Folder size={18} />,
		link: "/guest/medi-claim/listing",
	},
];
