// modules/guest/GuestSidebar.tsx
import { Folder } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";

export const guestSidebar: SidebarItem[] = [
	{
		id: "guest-vendor-onboarding",
		label: "My Submissions",
		icon: <Folder size={18} />,
		link: "/guest/medical-claim/form/create",
	},
];
