import { BriefcaseMedical } from "lucide-react";
import type { SidebarItem } from "../../../layout/layout.types";
//initiation/listing
export const medicalClaimSidebar: SidebarItem[] = [
	{
		id: "form-listing",
		label: "Medical Re-imbursement Listing",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/listing",
	},
	{
		id: "form-initiation-create",
		label: "Medical Re-imbursement Create",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/initiation/create",
	},
	{
		id: "form-create",
		label: "Medical Re-imbursement Form Create",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/create",
	},
	{
		id: "form-view",
		label: "Medical Re-imbursement Form View",
		icon: <BriefcaseMedical size={18} />,
		link: "/medi-claim/view",
	},
];
