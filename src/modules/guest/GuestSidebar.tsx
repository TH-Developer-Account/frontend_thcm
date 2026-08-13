// modules/guest/GuestSidebar.tsx
import { File, Folder } from "lucide-react";
import type { SidebarItem } from "../../layout/layout.types";

export const guestSidebar: SidebarItem[] = [
	{
		id: "guest-medical-claim-listing",
		label: "Forms Listing",
		icon: <Folder size={18} />,
		link: "/guest/medical-claim/listing",
	},
	{
		id: "guest-medical-claim-form",
		label: "Reimbursement Claim Form",
		icon: <File size={18} />,
		link: "/guest/medical-claim/form/create",
	},
];
