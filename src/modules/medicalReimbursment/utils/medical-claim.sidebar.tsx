import { BriefcaseMedical } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";
//initiation/listing
export const medicalClaimSidebar: SidebarItem[] = [
	{
		id: "form-listing",
		label: " Listing",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/listing",
	},
	{
		id: "form-initiation-create",
		label: "Initiate Create",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/initiation/create",
	},
];
